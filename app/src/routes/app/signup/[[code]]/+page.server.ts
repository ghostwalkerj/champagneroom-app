import { type Cookies, error, fail, redirect } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';

import { Agent, type AgentDocument } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import { User, type UserDocument } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import config from '$lib/config';
import { AuthType, UserRole } from '$lib/constants';
import {
  createAuthToken,
  setAuthToken,
  verifySignature
} from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';
const tokenName = env.AUTH_TOKEN_NAME || 'token';

const createUser = async ({
  request,
  role,
  cookies
}: {
  request: Request;
  role: UserRole;
  cookies: Cookies;
}) => {
  const data = await request.formData();
  const name = data.get('name') as string;
  const address = data.get('address') as string;
  const message = data.get('message') as string;
  const signature = data.get('signature') as string;
  const agentId = (data.get('agentId') as string) || undefined;

  // Verify Auth
  if (!verifySignature(message, address, signature)) {
    return fail(400, { invalidSignature: true });
  }

  // If there is a good signature, can set auth cookie here

  // Check if existing user, if so, throw new Error("User already exists");
  const user = (await User.findOne({
    address
  })) as UserDocument;

  if (user) {
    // Update User Nonce
    const nonce = Math.floor(Math.random() * 1_000_000);
    User.updateOne({ _id: user._id }, { $set: { nonce } }).exec();

    // Create Auth Token and set cookie
    const encAuthToken = createAuthToken({
      id: user._id.toString(),
      selector: '_id',
      authType: AuthType.SIGNING
    });

    encAuthToken && setAuthToken(cookies, tokenName, encAuthToken);
    return fail(400, { userExists: true });
  }

  try {
    // Create User
    const wallet = new Wallet();
    wallet.save();

    const user = await User.create({
      name,
      authType: AuthType.SIGNING,
      address: address.toLowerCase(),
      payoutAddress: address.toLowerCase(),
      wallet: wallet._id,
      roles: [role],
      nonce: Math.floor(Math.random() * 1_000_000)
    });

    // Create Auth Token and set cookie
    const encAuthToken = createAuthToken({
      id: user._id.toString(),
      selector: '_id',
      authType: AuthType.SIGNING
    });

    encAuthToken && setAuthToken(cookies, tokenName, encAuthToken);

    return {
      success: true,
      user,
      agentId
    };
  } catch (error) {
    console.error('err', error);
    return fail(400, { err: JSON.stringify(error) });
  }
};

export const actions: Actions = {
  create_agent: async ({ cookies, request }) => {
    const result = await createUser({ request, role: UserRole.AGENT, cookies });
    try {
      if ('success' in result) {
        const user = result.user;

        Agent.create({
          user: user._id,
          defaultCommissionRate: config.UI.defaultCommissionRate
        });

        redirect(303, config.PATH.agent);
      } else {
        return fail(400, result.data);
      }
    } catch (error) {
      console.error('err', error);
      return fail(400, { err: JSON.stringify(error) });
    }
  },
  create_creator: async ({ cookies, request }) => {
    const result = await createUser({
      request,
      role: UserRole.CREATOR,
      cookies
    });
    try {
      if ('success' in result) {
        const agentId = result.agentId || undefined;
        const user = result.user;

        const agent =
          agentId &&
          ((await Agent.findOne({ _id: agentId }).orFail(() => {
            throw error(404, 'Agent not found');
          })) as AgentDocument);
        const commissionRate =
          (agent && agent.defaultCommissionRate) ||
          config.UI.defaultCommissionRate;
        Creator.create({
          user: user._id,
          commissionRate,
          agent: agentId
        });

        if (agent) {
          User.updateOne(
            { _id: user._id },
            { $inc: { referralCount: 1 } }
          ).exec();
        }
        redirect(303, config.PATH.creator);
      } else {
        return fail(400, result.data);
      }
    } catch (error) {
      console.error('err', error);
      return fail(400, { err: JSON.stringify(error) });
    }
  }
};

export const load: PageServerLoad = async ({ params, locals }) => {
  const code = params.code as string;
  const nonce = Math.floor(Math.random() * 1_000_000);
  const message = env.AUTH_SIGNING_MESSAGE + ' ' + nonce;
  const user = locals.user;
  let agent: AgentDocument | undefined;

  if (user) {
    throw redirect(303, config.PATH.app);
  }

  if (code) {
    const referrer = (await User.findOne({ referralCode: code }).orFail(() => {
      throw error(404, 'Referrer not found');
    })) as UserDocument;

    if (!referrer || !referrer.isAgent()) {
      throw error(404, 'Referrer is not an Agent');
    }

    agent = (await Agent.findOne({ user: referrer._id }).orFail(() => {
      throw error(404, 'Agent not found');
    })) as AgentDocument;
  }
  return {
    message,
    agent:
      agent?.toJSON({ flattenMaps: true, flattenObjectIds: true }) ?? undefined
  };
};

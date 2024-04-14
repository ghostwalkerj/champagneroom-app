import { fail } from '@sveltejs/kit';

import { AUTH_SIGNING_MESSAGE, AUTH_TOKEN_NAME } from '$env/static/private';

import { Agent } from '$lib/models/agent';
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

const createUser = async ({
  request,
  role
}: {
  request: Request;
  role: UserRole;
}) => {
  const data = await request.formData();
  const name = data.get('name') as string;
  const address = data.get('address') as string;
  const message = data.get('message') as string;
  const signature = data.get('signature') as string;
  const agentId = (data.get('agentId') as string) || undefined;

  // Validation
  if (!name || name.length < 3 || name.length > 50) {
    return fail(400, { name, badName: true });
  }

  // Verify Auth
  if (!verifySignature(message, address, signature)) {
    return fail(400, { invalidSignature: true });
  }

  // Check if existing user, if so, throw new Error("User already exists");
  const user = (await User.findOne({
    address
  })) as UserDocument;
  if (user) {
    return user.isAgent()
      ? fail(400, { alreadyAgent: true })
      : fail(400, { alreadyUser: true });
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
      roles: [role]
    });
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
    try {
      const result = await createUser({ request, role: UserRole.AGENT });
      if ('success' in result) {
        const tokenName = AUTH_TOKEN_NAME || 'token';

        const user = result.user;

        Agent.create({
          user: user._id,
          defaultCommissionRate: config.UI.defaultCommissionRate
        });

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

        return {
          success: true,
          returnPath: config.PATH.agent
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('err', error);
      return fail(400, { err: JSON.stringify(error) });
    }
  },
  create_creator: async ({ request }: { request: Request }) => {
    try {
      const result = await createUser({ request, role: UserRole.CREATOR });
      if ('success' in result) {
        Creator.create({
          user: result.user._id,
          commissionRate: config.UI.defaultCommissionRate,
          agent: result.agentId || undefined
        });

        return {
          success: true,
          returnPath: config.PATH.agent
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('err', error);
      return fail(400, { err: JSON.stringify(error) });
    }
  }
};

export const load: PageServerLoad = async ({}) => {
  const nonce = Math.floor(Math.random() * 1_000_000);
  const message = AUTH_SIGNING_MESSAGE + ' ' + nonce;
  return {
    message
  };
};
import { fail } from '@sveltejs/kit';
import type { async } from 'rxjs';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';

import { Agent, type AgentDocument } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import { User, type UserDocument } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import config from '$lib/config';
import { AuthType, EntityType, UserRole } from '$lib/constants';
import { verifySignature } from '$lib/server/auth';

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
      wallet: wallet._id,
      roles: [role]
    });
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('err', error);
    return fail(400, { err: JSON.stringify(error) });
  }
};

export const actions: Actions = {
  create_agent: async ({ request }: { request: Request }) => {
    try {
      const result = await createUser({ request, role: UserRole.AGENT });
      if ('success' in result) {
        Agent.create({
          user: result.user._id,
          defaultCommissionRate: config.UI.defaultCommissionRate
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
  },
  create_creator: async ({ request }: { request: Request }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const address = data.get('address') as string;
    const message = data.get('message') as string;
    const signature = data.get('signature') as string;
    const agentId = data.get('agentId') as string;

    const returnPath = config.PATH.creator;

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    // Verify Auth
    if (!verifySignature(message, address, signature)) {
      return fail(400, { invalidSignature: true });
    }

    const agent = agentId
      ? await Agent.findById(agentId)
      : (undefined as AgentDocument | undefined);

    // Check if existing user, if so, add the role
    const user = await User.findOne({ address: address.toLowerCase() });
    if (user) {
      if (user.roles.includes(UserRole.CREATOR)) {
        return fail(400, { alreadyCreator: true });
      } else {
        user.roles.push(UserRole.CREATOR);
        user.name = name;
        user.updateOne(
          {
            roles: user.roles,
            name
          },
          { runValidators: true }
        );

        Creator.create({
          user: user._id,
          commissionRate: agent?.defaultCommissionRate ?? 0,
          agent: agent?._id ?? undefined
        });
        agent &&
          User.updateOne(
            { _id: agent?.user },
            { $inc: { referralCount: 1 } }
          ).exec();
      }
    } else {
      try {
        const wallet = await Wallet.create({});

        const user = await User.create({
          name,
          authType: AuthType.SIGNING,
          address: address.toLocaleLowerCase(),
          wallet: wallet._id,
          payoutAddress: address.toLocaleLowerCase(),
          roles: [EntityType.CREATOR],
          profileImageUrl
        });

        Creator.create({
          user: user._id,
          commissionRate: agent?.defaultCommissionRate ?? 0,
          agent: agent?._id ?? undefined
        });

        agent &&
          User.updateOne(
            { _id: agent?.user },
            { $inc: { referralCount: 1 } }
          ).exec();
      } catch (error) {
        console.error('err', error);
        return fail(400, { err: JSON.stringify(error) });
      }
      return {
        success: true,
        returnPath
      };
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

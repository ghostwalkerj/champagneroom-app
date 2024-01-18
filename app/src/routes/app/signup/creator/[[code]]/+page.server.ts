import { error, fail } from '@sveltejs/kit';
import * as web3 from 'web3';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';

import type { AgentDocument } from '$lib/models/agent';
import { Agent } from '$lib/models/agent';
import Config from '$lib/models/config';
import { Creator } from '$lib/models/creator';
import type { UserDocument } from '$lib/models/user';
import { User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { AuthType, EntityType, UserRole } from '$lib/constants';

import type { Actions, PageServerLoad } from './$types';

const verifySignature = (
  message: string,
  address: string,
  signature: string
) => {
  try {
    const signerAddr = web3.eth.accounts.recover(message, signature);
    if (signerAddr.toLowerCase() !== address.toLowerCase()) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const actions: Actions = {
  null_action: async () => {
    return {
      success: true
    };
  },
  create_creator: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const profileImageUrl = data.get('profileImageUrl') as string;
    const address = data.get('address') as string;
    const message = data.get('message') as string;
    const signature = data.get('signature') as string;
    const agentId = data.get('agentId') as string;

    const returnPath = Config.PATH.creator;

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
        await user.updateOne(
          {
            roles: user.roles,
            name
          },
          { runValidators: true }
        );

        await Creator.create({
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

        await Creator.create({
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

export const load: PageServerLoad = async ({ locals, params }) => {
  const code = params.code as string;
  const user = locals.user as UserDocument | undefined;
  const isCreator = user ? user.isCreator() : false;
  const nonce = Math.floor(Math.random() * 1_000_000);
  const message = AUTH_SIGNING_MESSAGE + ' ' + nonce;
  let agent: AgentDocument | undefined;

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
    user:
      user?.toJSON({ flattenMaps: true, flattenObjectIds: true }) ?? undefined,
    isCreator,
    agent:
      agent?.toJSON({ flattenMaps: true, flattenObjectIds: true }) ?? undefined
  };
};

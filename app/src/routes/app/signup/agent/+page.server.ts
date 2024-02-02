import { fail } from '@sveltejs/kit';
import * as web3 from 'web3';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';

import { Agent } from '$lib/models/agent';
import type { UserDocument } from '$lib/models/user';
import { User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import config from '$lib/config';
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
  create_agent: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const profileImageUrl = data.get('profileImageUrl') as string;
    const address = data.get('address') as string;
    const message = data.get('message') as string;
    const signature = data.get('signature') as string;
    const defaultCommissionRate = data.get('defaultCommissionRate') as string;

    const returnPath = config.PATH.agent;

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    // Verify Auth
    if (!verifySignature(message, address, signature)) {
      return fail(400, { invalidSignature: true });
    }

    if (
      !defaultCommissionRate ||
      Number.isNaN(Number(defaultCommissionRate)) ||
      Number(defaultCommissionRate) < 0 ||
      Number(defaultCommissionRate) > 100
    ) {
      return fail(400, { badCommission: true });
    }

    // Check if existing user, if so, add the role
    const user = (await User.findOne({
      address: address.toLowerCase()
    })) as UserDocument;
    if (user) {
      if (user.isAgent()) {
        return fail(400, { alreadyAgent: true });
      } else {
        user.roles.push(UserRole.AGENT);
        user.name = name;
        user.profileImageUrl = user.profileImageUrl || profileImageUrl;
        user.updateOne(
          {
            roles: user.roles,
            name: user.name,
            profileImageUrl: user.profileImageUrl
          },
          { runValidators: true }
        );

        Agent.create({
          user: user._id,
          defaultCommissionRate: Number(defaultCommissionRate)
        });

        return {
          success: true,
          returnPath
        };
      }
    } else {
      try {
        const wallet = new Wallet();
        wallet.save();

        const user = await User.create({
          name,
          authType: AuthType.SIGNING,
          address: address.toLocaleLowerCase(),
          wallet: wallet._id,
          payoutAddress: address.toLocaleLowerCase(),
          roles: [EntityType.AGENT],
          profileImageUrl
        });

        await Agent.create({
          user: user._id,
          defaultCommissionRate: Number(defaultCommissionRate)
        });
        return {
          success: true,
          returnPath
        };
      } catch (error) {
        console.error('err', error);
        return fail(400, { err: JSON.stringify(error) });
      }
    }
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user as UserDocument | undefined;
  const isAgent = user ? user.isAgent() : false;

  const nonce = Math.floor(Math.random() * 1_000_000);
  const message = AUTH_SIGNING_MESSAGE + ' ' + nonce;
  return {
    message,
    user: user?.toJSON({ flattenMaps: true, flattenObjectIds: true })
      ? user.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined,
    isAgent
  };
};

import { fail } from '@sveltejs/kit';
import * as web3 from 'web3';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';

import { Creator } from '$lib/models/creator';
import type { UserDocument } from '$lib/models/user';
import { User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import Config from '$lib/config';
import { AuthType, EntityType } from '$lib/constants';

import type { Actions, PageServerLoad } from '../$types';

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

    const returnPath = Config.PATH.creator;

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    // Verify Auth
    if (!verifySignature(message, address, signature)) {
      return fail(400, { invalidSignature: true });
    }

    // Check if existing user, if so, add the role
    const user = await User.findOne({ address: address.toLowerCase() });
    if (user) {
      if (user.roles.includes(EntityType.CREATOR)) {
        return fail(400, { alreadyCreator: true });
      } else {
        user.roles.push(EntityType.CREATOR);
        user.name = name;
        await user.save();

        await Creator.create({
          user: user._id,
          commissionRate: 0
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
          roles: [EntityType.CREATOR],
          profileImageUrl
        });

        await Creator.create({
          user: user._id,
          commissionRate: 0
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
  const isCreator = user ? user.isCreator() : false;
  const nonce = Math.floor(Math.random() * 1_000_000);
  const message = AUTH_SIGNING_MESSAGE + ' ' + nonce;
  return {
    message,
    user:
      user?.toObject({ flattenObjectIds: true, flattenMaps: true }) ??
      undefined,
    isCreator
  };
};

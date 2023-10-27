import { error, fail } from '@sveltejs/kit';
import * as web3 from 'web3';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';

import { Creator } from '$lib/models/creator';
import { AuthType, User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { EntityType } from '$lib/constants';

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
    console.log(error);
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

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    // Verify Auth
    if (!verifySignature(message, address, signature)) {
      throw error(400, 'Invalid Signature');
    }

    try {
      const wallet = new Wallet();
      wallet.save();

      const user = await User.create({
        name,
        authType: AuthType.SIGNING,
        address: address.toLocaleLowerCase(),
        wallet: wallet._id,
        payoutAddress: address.toLocaleLowerCase(),
        roles: [EntityType.CREATOR]
      });

      const creator = await Creator.create({
        user: user._id,
        agentCommission: 0,
        profileImageUrl
      });
      return {
        success: true,
        creator: creator.toObject({ flattenObjectIds: true, flattenMaps: true })
      };
    } catch (error) {
      console.log('err', error);
      return fail(400, { err: JSON.stringify(error) });
    }
  }
};

export const load: PageServerLoad = async () => {
  const nonce = Math.floor(Math.random() * 1_000_000);
  const message =
    EntityType.CREATOR + ': ' + AUTH_SIGNING_MESSAGE + ' ' + nonce;
  return {
    message
  };
};

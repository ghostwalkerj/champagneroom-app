import { error, fail } from '@sveltejs/kit';
import * as web3 from 'web3';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';

import { AuthType } from '$lib/models/common';
import { Creator } from '$lib/models/creator';

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
    const walletAddress = data.get('walletAddress') as string;
    const message = data.get('message') as string;
    const signature = data.get('signature') as string;

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    // Verify Auth
    if (!verifySignature(message, walletAddress, signature)) {
      throw error(400, 'Invalid Signature');
    }

    try {
      const creator = await Creator.create({
        user: {
          name,
          authType: AuthType.SIGNING,
          address: walletAddress.toLocaleLowerCase(),
          walletAddress: walletAddress.toLocaleLowerCase()
        },
        agentCommission: 0,
        profileImageUrl
      });
      return {
        success: true,
        creator: creator.toObject({ flattenObjectIds: true })
      };
    } catch (error) {
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

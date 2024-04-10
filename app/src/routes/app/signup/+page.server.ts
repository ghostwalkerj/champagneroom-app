import { fail } from '@sveltejs/kit';
import * as web3 from 'web3';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';

import { Agent } from '$lib/models/agent';
import { User, type UserDocument } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import config from '$lib/config';
import { AuthType, EntityType } from '$lib/constants';

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
  create_agent: async ({ request }) => {
    const data = await request.formData();
    const name = (data.get('name') as string).trim();
    const address = (data.get('address') as string).trim().toLowerCase();
    const message = data.get('message') as string;
    const signature = data.get('signature') as string;
    const returnPath = config.PATH.agent;

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
        roles: [EntityType.AGENT]
      });

      // Create Agent
      Agent.create({
        user: user._id,
        defaultCommissionRate: config.UI.defaultCommissionRate
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
};

export const load: PageServerLoad = async ({}) => {
  const nonce = Math.floor(Math.random() * 1_000_000);
  const message = AUTH_SIGNING_MESSAGE + ' ' + nonce;
  return {
    message
  };
};

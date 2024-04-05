import { fail } from '@sveltejs/kit';
import { z } from 'mongoose-zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import validator from 'validator';
import * as web3 from 'web3';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';

import { Agent, agentCRUDSchema } from '$lib/models/agent';
import { creatorCRUDSchema } from '$lib/models/creator';
import { User, userCRUDSchema } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import config from '$lib/config';
import { AuthType, EntityType } from '$lib/constants';

import type { Actions, PageServerLoad } from './$types';

const signupSchema = {
  message: z.string(),
  signature: z.string(),
  image: z
    .instanceof(File, { message: 'Please upload a file.' })
    .refine((f) => f.size < 100_000, 'Max 100 kB upload size.'),
  address: z
    .string()
    .trim()
    .refine((value: string) => validator.isEthereumAddress(value), {
      message: 'Invalid Ethereum address'
    })
};

const agentSignupSchema = userCRUDSchema
  .merge(agentCRUDSchema)
  .extend(signupSchema);

const creatorSignupSchema = userCRUDSchema
  .merge(creatorCRUDSchema)
  .extend(signupSchema);

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
    const formData = await request.formData();
    const form = await superValidate(formData, zod(agentSignupSchema), {});

    if (!form.valid) {
      return fail(400, { form });
    }
    const returnPath = config.PATH.agent;
    const { message, signature, address, name, defaultCommissionRate } =
      form.data;

    // Verify Auth
    if (!verifySignature(message, address, signature)) {
      return fail(400, { invalidSignature: true });
    }

    // Check if existing user, if so, return an error
    const user = await User.exists({
      address: address.toLowerCase()
    });
    if (user) {
      return fail(400, { userExists: true });
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
        roles: [EntityType.AGENT],
        profileImageUrl: config.UI.defaultProfileImage
      });

      await Agent.create({
        user: user._id,
        defaultCommissionRate
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
  const agentForm = await superValidate(zod(agentSignupSchema));
  const creatorForm = await superValidate(zod(creatorSignupSchema));

  const nonce = Math.floor(Math.random() * 1_000_000);
  const message = AUTH_SIGNING_MESSAGE + ' ' + nonce;
  return {
    agentForm,
    creatorForm,
    nonce,
    message
  };
};

import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';
import { recover } from 'web3-eth-accounts';

import {
  AUTH_SIGNING_MESSAGE,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';
import { PUBLIC_AGENT_PATH } from '$env/static/public';

import { Agent } from '$lib/models/agent';

import type { PageServerLoad } from './$types';

const verifySignature = (
  message: string,
  address: string,
  signature: string
) => {
  try {
    const signerAddr = recover(message, signature);
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
  auth: async ({ params, cookies, request, url }) => {
    const address = params.address;
    const agentUrl = urlJoin(url.origin, PUBLIC_AGENT_PATH);

    if (!address) {
      throw error(404, 'Bad address');
    }

    const data = await request.formData();
    const signature = data.get('signature') as string;

    if (!signature) {
      throw error(400, 'Missing Signature');
    }

    const agent = await Agent.findOne({ 'user.address': address })
      .orFail(() => {
        throw redirect(307, agentUrl);
      })
      .exec();

    const message = AUTH_SIGNING_MESSAGE + agent.user.nonce;

    // Verify Auth
    if (!verifySignature(message, address, signature)) {
      throw error(400, 'Invalid Signature');
    }

    // Update Operator
    agent.user.nonce = Math.floor(Math.random() * 1_000_000);
    await agent.save();

    const exp = Math.floor(Date.now() / 1000) + +JWT_EXPIRY;

    // Set JWT Token
    const authToken = jwt.sign(
      {
        agent: address,
        exp
      },
      JWT_PRIVATE_KEY
    );
    cookies.set('agentAuthToken', authToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: exp
    });
  }
};

export const load: PageServerLoad = async ({ params, url }) => {
  const address = params.address;
  const agentUrl = urlJoin(url.origin, PUBLIC_AGENT_PATH);

  if (address === null) {
    throw redirect(307, agentUrl);
  }

  const agent = await Agent.findOne({ 'user.address': address })
    .orFail(() => {
      throw redirect(307, agentUrl);
    })
    .lean()
    .exec();

  const message = AUTH_SIGNING_MESSAGE + agent.user.nonce;
  return {
    message
  };
};

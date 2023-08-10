import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { recover } from 'web3-eth-accounts';

import {
  AUTH_SIGNING_MESSAGE,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';
import {
  PUBLIC_AUTH_PATH,
  PUBLIC_CREATOR_SIGNUP_PATH
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import type { UserType } from '$lib/models/common';
import { Creator } from '$lib/models/creator';
import { Operator } from '$lib/models/operator';

import { EntityType } from '$lib/constants';

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
  signing_auth: async ({ cookies, request }) => {
    const data = await request.formData();
    const signature = data.get('signature') as string;
    const address = data.get('address') as string;
    const role = data.get('role') as string;
    const tokenName = data.get('tokenName') as string;
    const message = data.get('message') as string;
    const returnPath = data.get('returnPath') as string;

    if (!address) {
      throw error(404, 'Bad address');
    }

    if (!signature) {
      throw error(400, 'Missing Signature');
    }

    if (!role) {
      throw error(400, 'Missing Role');
    }

    if (!tokenName) {
      throw error(400, 'Missing Token Name');
    }

    if (!message) {
      throw error(400, 'Missing Message');
    }

    if (!returnPath) {
      throw error(400, 'Missing Return Path');
    }

    // Verify Auth
    if (!verifySignature(message, address, signature)) {
      throw error(400, 'Invalid Signature');
    }

    // Update User Nonce
    const nonce = Math.floor(Math.random() * 1_000_000);
    switch (role) {
      case EntityType.AGENT: {
        Agent.updateOne(
          { 'user.address': address },
          { $set: { 'user.nonce': nonce } }
        ).exec();
        break;
      }
      case EntityType.CREATOR: {
        Creator.updateOne(
          { 'user.address': address },
          { $set: { 'user.nonce': nonce } }
        ).exec();
        break;
      }
      case EntityType.OPERATOR: {
        Operator.updateOne(
          { 'user.address': address },
          { $set: { 'user.nonce': nonce } }
        ).exec();
        break;
      }
      default: {
        throw error(400, 'Invalid Role');
      }
    }

    const exp = Math.floor(Date.now() / 1000) + +JWT_EXPIRY;

    const authToken = jwt.sign(
      {
        address,
        authType: 'SIGNING',
        exp
      },
      JWT_PRIVATE_KEY
    );
    cookies.set(tokenName, authToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: exp
    });
    throw redirect(302, returnPath);
  },
  unique_key_auth: async ({ cookies, request }) => {
    const data = await request.formData();
    const address = data.get('address') as string;
    const tokenName = data.get('tokenName') as string;
    const returnPath = data.get('returnPath') as string;

    if (!address) {
      throw error(404, 'Bad address');
    }

    if (!tokenName) {
      throw error(400, 'Missing Token Name');
    }

    if (!returnPath) {
      throw error(400, 'Missing Return Path');
    }

    const exp = Math.floor(Date.now() / 1000) + +JWT_EXPIRY;

    const authToken = jwt.sign(
      {
        address,
        exp,
        authType: 'UNIQUE KEY'
      },
      JWT_PRIVATE_KEY
    );
    cookies.set(tokenName, authToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: exp
    });
    throw redirect(302, returnPath);
  }
};

export const load: PageServerLoad = async ({ cookies }) => {
  const address = cookies.get('address');
  const tokenName = cookies.get('tokenName');
  const role = cookies.get('role');

  cookies.delete('address', { path: PUBLIC_AUTH_PATH });
  cookies.delete('tokenName', { path: PUBLIC_AUTH_PATH });
  cookies.delete('role', { path: PUBLIC_AUTH_PATH });

  if (!address || !tokenName || !role) {
    throw error(400, 'Missing Cookie');
  }

  let user: UserType | undefined;

  switch (role) {
    case EntityType.AGENT: {
      const agent = await Agent.findOne({ 'user.address': address }).exec();
      if (agent) {
        user = agent.toObject({ flattenObjectIds: true }).user;
      }
      break;
    }
    case EntityType.CREATOR: {
      const creator = await Creator.findOne({ 'user.address': address }).exec();
      if (creator) {
        user = creator.toObject({ flattenObjectIds: true }).user;
      }
      break;
    }
    case EntityType.OPERATOR: {
      const operator = await Operator.findOne({
        'user.address': address
      }).exec();
      if (operator) {
        user = operator.toObject({ flattenObjectIds: true }).user;
      }
      break;
    }
    default: {
      throw error(400, 'Invalid Role');
    }
  }

  if (user === undefined) {
    const redir =
      role === EntityType.CREATOR
        ? redirect(302, PUBLIC_CREATOR_SIGNUP_PATH)
        : error(400, 'Invalid User');
    throw redir;
  }

  const message = role + ' : ' + AUTH_SIGNING_MESSAGE + user!.nonce;
  return {
    message,
    address,
    tokenName,
    role,
    user
  };
};

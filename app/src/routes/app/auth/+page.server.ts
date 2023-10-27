import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { max } from 'rxjs';

import {
  AUTH_SIGNING_MESSAGE,
  AUTH_TOKEN_NAME,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';
import { PUBLIC_SIGNUP_PATH } from '$env/static/public';

import { AuthType, User } from '$lib/models/user';

import { verifySignature } from '$lib/server/auth';

import type { PageServerLoad } from './$types';

const tokenName = AUTH_TOKEN_NAME || 'token';

export const actions: Actions = {
  get_signing_message: async ({ request }) => {
    const data = await request.formData();
    const address = data.get('address') as string;
    if (!address) {
      throw error(404, 'Bad address');
    }

    const user = await User.findOne({ address }).select('nonce').exec();
    if (!user) {
      throw redirect(302, PUBLIC_SIGNUP_PATH);
    }
    const message = AUTH_SIGNING_MESSAGE + ' ' + user.nonce;
    return {
      message
    };
  },
  signing_auth: async ({ cookies, request }) => {
    const data = await request.formData();
    const signature = data.get('signature') as string;
    const address = data.get('address') as string;
    const message = data.get('message') as string;
    const returnPath = data.get('returnPath') as string;

    if (!address) {
      throw error(404, 'Bad address');
    }

    if (!signature) {
      throw error(400, 'Missing Signature');
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
    User.updateOne({ address }, { $set: { nonce } }).exec();

    const exp = +JWT_EXPIRY;

    const authToken = jwt.sign(
      {
        address,
        authType: AuthType.SIGNING,
        exp
      },
      JWT_PRIVATE_KEY
    );
    cookies.set(tokenName, authToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: exp,
      expires: new Date(exp)
    });
    throw redirect(302, returnPath);
  },
  unique_key_auth: async ({ cookies, request }) => {
    const data = await request.formData();
    const address = data.get('address') as string;
    const returnPath = data.get('returnPath') as string;

    if (!address) {
      throw error(404, 'Bad address');
    }

    if (!returnPath) {
      throw error(400, 'Missing Return Path');
    }

    const exp = Math.floor(Date.now() / 1000) + +JWT_EXPIRY;

    const authToken = jwt.sign(
      {
        address,
        exp,
        authType: AuthType.UNIQUE_KEY
      },
      JWT_PRIVATE_KEY
    );
    cookies.set(tokenName, authToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: exp,
      expires: new Date(exp)
    });
    throw redirect(302, returnPath);
  }
};

export const load: PageServerLoad = async ({ cookies }) => {
  const address = cookies.get('address');
  const returnPath = cookies.get('returnPath');

  let authType = AuthType.SIGNING;
  let message = '';

  const user = await User.findOne({ address }).exec();

  if (user) {
    authType = user.authType as AuthType;
    message = AUTH_SIGNING_MESSAGE + ' ' + user.nonce;
  }

  return {
    message,
    address,
    returnPath,
    authType
  };
};

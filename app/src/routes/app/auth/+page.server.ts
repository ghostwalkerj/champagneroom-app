import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

import {
  AUTH_MAX_AGE,
  AUTH_SIGNING_MESSAGE,
  AUTH_TOKEN_NAME,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';

import { AuthType, User, UserRole } from '$lib/models/user';

import { getSecretSlug, verifySignature } from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';

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
      console.error('User not found');
      throw error(404, 'User not found');
    }
    const message = AUTH_SIGNING_MESSAGE + ' ' + user.nonce;
    return {
      success: true,
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
    const authToken = jwt.sign(
      {
        address,
        selector: 'address',
        authType: AuthType.SIGNING,
        exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY
      },
      JWT_PRIVATE_KEY
    );

    cookies.delete('returnPath', { path: '/' });

    cookies.set(tokenName, authToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: +AUTH_MAX_AGE,
      expires: new Date(Date.now() + +AUTH_MAX_AGE)
    });
    throw redirect(302, returnPath);
  },
  password_secret_auth: async ({ cookies, request }) => {
    const data = await request.formData();
    const secret = data.get('secret') as string;
    const slug = data.get('slug') as string;

    if (!secret) {
      console.error('No secret');
      throw error(404, 'Bad secret');
    }

    if (!slug) {
      console.error('No slug');
      throw error(404, 'Bad slug');
    }

    // verify the user exists and has password auth
    if (slug === UserRole.CREATOR.toLocaleLowerCase()) {
      const user = await User.findOne({
        secret
      });
      if (!user) {
        console.error('User not found');
        throw error(404, 'Bad slug');
      }
    }

    const authToken = jwt.sign(
      {
        selector: 'secret',
        secret,
        slug,
        exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
        authType: AuthType.PASSWORD_SECRET
      },
      JWT_PRIVATE_KEY
    );

    cookies.delete('returnPath', { path: '/' });
    cookies.set(tokenName, authToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: +AUTH_MAX_AGE,
      expires: new Date(Date.now() + +AUTH_MAX_AGE)
    });
    return { success: true };
  }
} satisfies Actions;

export const load: PageServerLoad = async ({ cookies }) => {
  const returnPath = cookies.get('returnPath');
  const { slug, secret } = getSecretSlug(returnPath);

  if (!returnPath) {
    throw error(400, 'Missing Return Path');
  }

  const authType = secret ? AuthType.PASSWORD_SECRET : AuthType.SIGNING;

  return {
    returnPath,
    authType,
    slug,
    secret
  };
};

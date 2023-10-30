import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

import {
  AUTH_MAX_AGE,
  AUTH_SIGNING_MESSAGE,
  AUTH_TOKEN_NAME,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';
import { PUBLIC_AUTH_PATH } from '$env/static/public';

import { AuthType, User, UserRole } from '$lib/models/user';

import { EntityType } from '$lib/constants';
import {
  decryptFromCookie,
  encrypt4Cookie,
  getSecretSlug,
  verifySignature
} from '$lib/server/auth';

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

    if (!address) {
      throw error(404, 'Bad address');
    }

    if (!signature) {
      throw error(400, 'Missing Signature');
    }

    if (!message) {
      throw error(400, 'Missing Message');
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

    const encAuthToken = encrypt4Cookie(authToken);

    encAuthToken &&
      cookies.set(tokenName, encAuthToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: +AUTH_MAX_AGE,
        expires: new Date(Date.now() + +AUTH_MAX_AGE)
      });
    return { success: true };
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

    const encAuthToken = encrypt4Cookie(authToken);

    encAuthToken &&
      cookies.set(tokenName, authToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        maxAge: +AUTH_MAX_AGE,
        expires: new Date(Date.now() + +AUTH_MAX_AGE)
      });
    return { success: true };
  },
  pin_auth: async ({ cookies }) => {
    const pin = cookies.get('pin');
    const userId = cookies.get('userId') as string;

    if (!pin) {
      console.error('No pin');
      throw error(404, 'Bad pin');
    }

    if (!userId) {
      console.error('No userId');
      throw error(404, 'Bad userId');
    }

    const clearPin = decryptFromCookie(pin);
    const clearUserId = decryptFromCookie(userId);

    const user = await User.findOne({
      _id: clearUserId
    });
    if (!user) {
      console.error('User not found');
      throw error(404, 'Bad user');
    }

    if (clearPin && clearUserId) {
      const goodPin = user.comparePassword(clearPin);
      if (!goodPin) {
        console.error('Bad pin');
        throw error(404, 'Bad pin');
      }
      const authToken = jwt.sign(
        {
          selector: '_id',
          password: clearPin,
          _id: clearUserId,
          exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
          authType: AuthType.PIN
        },
        JWT_PRIVATE_KEY
      );

      const encAuthToken = encrypt4Cookie(authToken);
      cookies.delete('pin', { path: PUBLIC_AUTH_PATH });
      cookies.delete('userId', { path: PUBLIC_AUTH_PATH });

      encAuthToken &&
        cookies.set(tokenName, encAuthToken, {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          maxAge: +AUTH_MAX_AGE,
          expires: new Date(Date.now() + +AUTH_MAX_AGE)
        });
    }
    return { success: true };
  }
} satisfies Actions;

export const load: PageServerLoad = async ({ cookies }) => {
  const returnPath = cookies.get('returnPath');
  const clearReturnPath = decryptFromCookie(returnPath);
  const { slug, secret } = getSecretSlug(clearReturnPath);

  if (!clearReturnPath) {
    throw error(400, 'Missing Return Path');
  }
  let authType = AuthType.NONE;

  switch (slug) {
    case EntityType.CREATOR.toLocaleLowerCase(): {
      authType = AuthType.PASSWORD_SECRET;
      break;
    }
    case EntityType.TICKET.toLocaleLowerCase(): {
      authType = AuthType.PIN;
      break;
    }
    default: {
      authType = AuthType.SIGNING;
    }
  }

  cookies.delete('returnPath', { path: PUBLIC_AUTH_PATH });

  return {
    returnPath: clearReturnPath,
    authType,
    slug,
    secret
  };
};

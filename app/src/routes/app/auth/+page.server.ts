import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

import {
  AUTH_MAX_AGE,
  AUTH_SALT,
  AUTH_SIGNING_MESSAGE,
  AUTH_TOKEN_NAME,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';
import { PUBLIC_AUTH_PATH } from '$env/static/public';

import { User } from '$lib/models/user';

import { AuthType } from '$lib/constants';
import { authDecrypt, authEncrypt } from '$lib/crypt';
import {
  isPasswordMatch,
  isPinMatch,
  isSecretMatch,
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

    const user = await User.findOne({ address, authType: AuthType.SIGNING })
      .select('nonce')
      .exec();
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

    // Check if user exists
    const exists = await User.exists({
      address,
      authType: AuthType.SIGNING
    }).exec();

    if (!exists) {
      console.error('User not found');
      throw error(404, 'User not found');
    }

    // Update User Nonce
    const nonce = Math.floor(Math.random() * 1_000_000);
    User.updateOne({ _id: exists._id }, { $set: { nonce } }).exec();
    const authToken = jwt.sign(
      {
        selector: '_id',
        _id: exists._id,
        authType: AuthType.SIGNING,
        exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY
      },
      JWT_PRIVATE_KEY
    );

    const encAuthToken = authEncrypt(authToken, AUTH_SALT);

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
    const slug = data.get('slug') as string;

    if (!slug) {
      console.error('No slug');
      throw error(404, 'Bad slug');
    }

    // Check if user exists
    const exists = await User.exists({
      secret: slug,
      authType: AuthType.PATH_PASSWORD
    }).exec();

    if (!exists) {
      console.error('User not found');
      throw error(404, 'User not found');
    }

    const authToken = jwt.sign(
      {
        selector: 'secret',
        secret: slug,
        _id: exists._id,
        exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
        authType: AuthType.PATH_PASSWORD
      },
      JWT_PRIVATE_KEY
    );

    const encAuthToken = authEncrypt(authToken, AUTH_SALT);

    encAuthToken &&
      cookies.set(tokenName, encAuthToken, {
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

    const clearPin = authDecrypt(pin, AUTH_SALT);
    const clearUserId = authDecrypt(userId, AUTH_SALT);

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

      const encAuthToken = authEncrypt(authToken, AUTH_SALT);
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

export const load: PageServerLoad = async ({ url }) => {
  const returnPath = url.searchParams.get('returnPath');
  if (!returnPath) {
    throw error(400, 'Missing Return Path');
  }

  let slug = '';

  if (!returnPath) {
    throw error(400, 'Missing Return Path');
  }
  let authType = AuthType.SIGNING;

  if (isPinMatch(returnPath)) {
    console.log('Pin match');
    authType = AuthType.PIN;
  } else if (isPasswordMatch(returnPath)) {
    console.log('Password match');
    authType = AuthType.PATH_PASSWORD;
  }
  if (isSecretMatch(returnPath)) {
    const pathParts = returnPath.split('/');
    if (pathParts.length > 3) {
      slug = pathParts.at(-1) || '';
    }
  }

  return {
    returnPath,
    authType,
    slug
  };
};

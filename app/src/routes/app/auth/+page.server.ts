import { error, fail, redirect } from '@sveltejs/kit';
import to from 'await-to-js';
import jwt from 'jsonwebtoken';

import {
  AUTH_MAX_AGE,
  AUTH_SALT,
  AUTH_SIGNING_MESSAGE,
  AUTH_TOKEN_NAME,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';

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
      return fail(400, { missingAddress: true });
    }

    const user = await User.findOne({ address, authType: AuthType.SIGNING })
      .select('nonce')
      .exec();
    if (!user) {
      console.error('User not found');
      return fail(404, {
        userNotFound: true
      });
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
      return fail(400, { missingAddress: true });
    }

    if (!signature) {
      return fail(400, { missingSignature: true });
    }

    if (!message) {
      return fail(400, { missingMessage: true });
    }

    // Verify Auth
    if (!verifySignature(message, address, signature)) {
      return fail(400, { badSignature: true });
    }

    // Check if user exists
    const exists = await User.exists({
      address,
      authType: AuthType.SIGNING
    }).exec();

    if (!exists) {
      console.error('User not found');
      return fail(404, {
        userNotFound: true
      });
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
    const parseId = data.get('parseId') as string;

    if (!parseId) {
      console.error('No parseId');
      return fail(400, { missingParseId: true });
    }

    // Check if user exists
    const exists = await User.exists({
      secret: parseId,
      authType: AuthType.PATH_PASSWORD
    }).exec();

    if (!exists) {
      console.error('User not found');
      return fail(404, {
        userNotFound: true
      });
    }

    const authToken = jwt.sign(
      {
        selector: 'secret',
        secret: parseId,
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
      return fail(400, { badPin: true });
    }

    if (!userId) {
      console.error('No userId');
      return fail(400, { badUserId: true });
    }

    const clearPin = authDecrypt(pin, AUTH_SALT);
    const clearUserId = authDecrypt(userId, AUTH_SALT);

    const user = await User.findOne({
      _id: clearUserId
    });
    if (!user) {
      console.error('User not found');
      return fail(404, {
        userNotFound: true
      });
    }

    if (clearPin && clearUserId) {
      const goodPin = user.comparePassword(clearPin);
      if (!goodPin) {
        console.error('Bad pin');
        return fail(400, { badPin: true });
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

export const load: PageServerLoad = async ({ url, cookies }) => {
  const returnPath = url.searchParams.get('returnPath');
  const shouldSignOut = url.searchParams.has('signOut');

  if (shouldSignOut) {
    cookies.delete(tokenName, { path: '/' });
    return { signOut: true };
  }
  if (!returnPath) {
    throw error(400, 'Missing Return Path');
  }

  let parseId = '';

  if (!returnPath) {
    throw error(400, 'Missing Return Path');
  }
  let authType = AuthType.SIGNING;

  if (isPinMatch(returnPath)) {
    authType = AuthType.PIN;
  } else if (isPasswordMatch(returnPath)) {
    authType = AuthType.PATH_PASSWORD;
  }
  if (isSecretMatch(returnPath)) {
    const pathParts = returnPath.split('/');
    if (pathParts.length >= 4) {
      parseId = pathParts.at(3) || '';
    }
  }

  return {
    returnPath,
    authType,
    parseId,
    signOut: false
  };
};

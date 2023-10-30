import crypto from 'node:crypto';

import * as web3 from 'web3';
import wcmatch from 'wildcard-match';

import { AUTH_SALT } from '$env/static/private';
import {
  PUBLIC_AUTH_PATH,
  PUBLIC_CREATOR_PATH,
  PUBLIC_SHOW_PATH,
  PUBLIC_SIGNUP_PATH,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

export { PUBLIC_APP_PATH as APP_PATH } from '$env/static/public';

export const PATH_WHITELIST = [
  PUBLIC_SHOW_PATH + '/**',
  PUBLIC_AUTH_PATH,
  PUBLIC_SIGNUP_PATH
];

export const SECRET_PATHS = [PUBLIC_CREATOR_PATH, PUBLIC_TICKET_PATH];

const isWhitelistMatch = wcmatch(PATH_WHITELIST);

export const decryptFromCookie = (cookie: string | undefined) => {
  if (!cookie) {
    return;
  }
  try {
    const textParts = cookie.split(':');
    const shifted = textParts.shift();
    const iv = shifted && (Buffer.from(shifted, 'hex') as Buffer);

    if (!iv) {
      return;
    }

    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto
      .createHash('sha256')
      .update(AUTH_SALT)
      .digest('base64')
      .slice(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    const decrypted = decipher.update(encryptedData);
    const decryptedText = Buffer.concat([decrypted, decipher.final()]);
    return decryptedText.toString();
  } catch (error) {
    console.log(error);
  }
};

export const encrypt4Cookie = (cookie: string) => {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto
      .createHash('sha256')
      .update(AUTH_SALT)
      .digest('base64')
      .slice(0, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(cookie);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.log(error);
  }
};

export const getSecretSlug = (requestedPath: string | undefined) => {
  let secret: string | undefined;
  let slug: string | undefined;
  if (
    requestedPath &&
    SECRET_PATHS.some((path) => requestedPath.startsWith(path))
  ) {
    const pathParts = requestedPath.split('/');
    if (pathParts.length > 3) {
      secret = pathParts.at(-1);
      slug = pathParts.at(-2);
    }
  }
  return { secret, slug };
};

export const verifyPath = (requestedPath: string, allowedPaths: string[]) => {
  // If the requested path is not in the whitelist, return false
  console.log('requestedPath', requestedPath);
  console.log('allowedPaths', allowedPaths);
  console.log('isWhitelistMatch', isWhitelistMatch(requestedPath));
  return (
    isWhitelistMatch(requestedPath) || allowedPaths.includes(requestedPath)
  );
};

export const verifySignature = (
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

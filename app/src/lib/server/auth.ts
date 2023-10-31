import crypto from 'node:crypto';

import outmatch from 'outmatch';
import * as web3 from 'web3';

import { AUTH_SALT } from '$env/static/private';
import {
  PUBLIC_API_PATH,
  PUBLIC_APP_PATH,
  PUBLIC_AUTH_PATH,
  PUBLIC_CREATOR_PATH,
  PUBLIC_SHOW_PATH,
  PUBLIC_SIGNUP_PATH,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

const PASSWORD_PATHS = [PUBLIC_CREATOR_PATH + '/[A-Za-z0-9_-]*'];

const PIN_PATHS = [PUBLIC_TICKET_PATH + '/[A-Za-z0-9_-]*'];

//const PROTECTED_PATHS = [PUBLIC_APP_PATH + '/**', PUBLIC_API_PATH + '/**'];
const PROTECTED_PATHS = [PUBLIC_APP_PATH + '/**'];

const WHITELIST_PATHS = [
  PUBLIC_SHOW_PATH + '/**',
  PUBLIC_AUTH_PATH,
  PUBLIC_SIGNUP_PATH
];

const TICKET_PATHS = [PUBLIC_TICKET_PATH + '/[A-Za-z0-9_-]*'];
const CREATOR_PATHS = [PUBLIC_CREATOR_PATH + '/[A-Za-z0-9_-]*'];
const SECRET_PATHS = [...PASSWORD_PATHS, ...PIN_PATHS];

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

export const isCreatorMatch = outmatch(CREATOR_PATHS);
export const isPasswordMatch = outmatch(PASSWORD_PATHS);
export const isPinMatch = outmatch(PIN_PATHS);
export const isProtectedMatch = outmatch(PROTECTED_PATHS);
export const isSecretMatch = outmatch(SECRET_PATHS);
export const isTicketMatch = outmatch(TICKET_PATHS);
export const isWhitelistMatch = outmatch(WHITELIST_PATHS);

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

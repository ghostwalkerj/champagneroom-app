import crypto from 'node:crypto';

import type { Cookies } from '@sveltejs/kit';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import outmatch from 'outmatch';
import * as web3 from 'web3';

import {
  AUTH_MAX_AGE,
  AUTH_SALT,
  BITCART_INVOICE_NOTIFICATION_PATH,
  BITCART_PAYOUT_NOTIFICATION_PATH,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';

import Config from '$lib/config';
import type { AuthType } from '$lib/constants';

const idString = '/[A-Za-z0-9_-]*';

const PASSWORD_PATHS = [
  Config.PATH.creator + idString,
  Config.PATH.creator + idString
];
const PIN_PATHS = [Config.PATH.ticket + idString];

const PROTECTED_PATHS = [
  Config.PATH.app + '/**',
  Config.PATH.api + '/**',
  Config.PATH.app,
  Config.PATH.api
];

const NOTIFICATION_PATHS = [
  Config.PATH.notifyUpdate + idString,
  Config.PATH.notifyInsert + idString
];

const WEBHOOK_PATHS = [
  BITCART_INVOICE_NOTIFICATION_PATH + idString,
  BITCART_PAYOUT_NOTIFICATION_PATH + idString
];

const WHITELIST_PATHS = [
  Config.PATH.show + '/**',
  Config.PATH.auth,
  Config.PATH.signout,
  Config.PATH.signup + '/**',
  Config.PATH.signup,
  ...WEBHOOK_PATHS
];

const TICKET_PATHS = [Config.PATH.ticket + '/**', Config.PATH.ticket];
const CREATOR_PATHS = [
  Config.PATH.creator,
  Config.PATH.creator + '/**',
  Config.PATH.imageUpload
];
const SECRET_PATHS = [...PASSWORD_PATHS, ...PIN_PATHS];
const AGENT_PATHS = [Config.PATH.agent];
const OPERATOR_PATHS = [Config.PATH.operator];

const SIGN_PATHS = [...AGENT_PATHS, ...OPERATOR_PATHS, Config.PATH.creator];

const REQUEST_AUTH_PATHS = [
  ...SIGN_PATHS,
  ...PASSWORD_PATHS,
  ...PIN_PATHS,
  Config.PATH.app,
  Config.PATH.ticket,
  Config.PATH.creator,
  Config.PATH.operator,
  Config.PATH.agent
];

export const authDecrypt = (text: string | undefined, authSalt: string) => {
  if (!text) {
    return;
  }
  try {
    const textParts = text.split(':');
    const shifted = textParts.shift();
    const iv = shifted && (Buffer.from(shifted, 'hex') as Buffer);

    if (!iv) {
      return;
    }

    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto
      .createHash('sha256')
      .update(authSalt)
      .digest('base64')
      .slice(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    const decrypted = decipher.update(encryptedData);
    const decryptedText = Buffer.concat([decrypted, decipher.final()]);
    return decryptedText.toString();
  } catch (error) {
    console.error(error);
  }
};

export const authEncrypt = (text: string | undefined, authSalt: string) => {
  if (!text) {
    return;
  }
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto
      .createHash('sha256')
      .update(authSalt)
      .digest('base64')
      .slice(0, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error(error);
  }
};

export const createAuthToken = ({
  id,
  selector,
  authType,
  secret
}: {
  id: string;
  selector: string;
  authType: AuthType;
  secret?: string;
}): string => {
  const authToken = jwt.sign(
    {
      selector,
      secret,
      _id: id,
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      authType
    },
    JWT_PRIVATE_KEY
  );
  const encAuthToken = authEncrypt(authToken, AUTH_SALT);
  return encAuthToken!;
};

export const deleteAuthToken = (cookies: Cookies, tokenName: string) => {
  cookies.delete(tokenName, { path: '/' });
};

export const getAuthToken = (
  cookies: Cookies,
  tokenName: string
): JwtPayload | undefined => {
  const encryptedToken = cookies.get(tokenName);
  const authToken = authDecrypt(encryptedToken, AUTH_SALT);
  if (!authToken) {
    return;
  }
  const decode = jwt.verify(authToken, JWT_PRIVATE_KEY) as JwtPayload;
  if (!decode) {
    throw new Error('Invalid auth token');
  }
  return decode;
};

export const isAgentMatch = outmatch(AGENT_PATHS);
export const isCreatorMatch = outmatch(CREATOR_PATHS);
export const isNotificationMatch = outmatch(NOTIFICATION_PATHS);
export const isOperatorMatch = outmatch(OPERATOR_PATHS);
export const isPasswordMatch = outmatch(PASSWORD_PATHS);
export const isPinMatch = outmatch(PIN_PATHS);
export const isProtectedMatch = outmatch(PROTECTED_PATHS);
export const isRequestAuthMatch = outmatch(REQUEST_AUTH_PATHS);
export const isSecretMatch = outmatch(SECRET_PATHS);
export const isTicketMatch = outmatch(TICKET_PATHS);

export const isWebhookMatch = outmatch(WEBHOOK_PATHS);

export const isWhitelistMatch = outmatch(WHITELIST_PATHS);

export const setAuthCookie = (
  cookies: Cookies,
  tokenName: string,
  authToken: string
) => {
  cookies.set(tokenName, authToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: +AUTH_MAX_AGE,
    expires: new Date(Date.now() + +AUTH_MAX_AGE)
  });
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
    console.error(error);
    return false;
  }
};

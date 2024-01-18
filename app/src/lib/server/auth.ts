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

import config from '$lib/config';
import type { AuthType } from '$lib/constants';
import { authDecrypt, authEncrypt } from '$lib/crypt';

const idString = '/[A-Za-z0-9_-]*';

const PASSWORD_PATHS = [
  config.PATH.creator + idString,
  config.PATH.creator + idString
];
const PIN_PATHS = [config.PATH.ticket + idString];

const PROTECTED_PATHS = [
  config.PATH.app + '/**',
  config.PATH.api + '/**',
  config.PATH.app,
  config.PATH.api
];

const NOTIFICATION_PATHS = [
  config.PATH.notifyUpdate + idString,
  config.PATH.notifyInsert + idString
];

const WEBHOOK_PATHS = [
  BITCART_INVOICE_NOTIFICATION_PATH + idString,
  BITCART_PAYOUT_NOTIFICATION_PATH + idString
];

const WHITELIST_PATHS = [
  config.PATH.show + '/**',
  config.PATH.auth,
  config.PATH.signout,
  config.PATH.revert,
  config.PATH.signup + '/**',
  config.PATH.room,
  config.PATH.room + '/**',
  config.PATH.signup,
  ...WEBHOOK_PATHS
];

const TICKET_PATHS = [config.PATH.ticket + '/**', config.PATH.ticket];
const CREATOR_PATHS = [
  config.PATH.creator,
  config.PATH.creator + '/**',
  config.PATH.imageUpload
];
const SECRET_PATHS = [...PASSWORD_PATHS, ...PIN_PATHS];
const AGENT_PATHS = [config.PATH.agent];
const OPERATOR_PATHS = [config.PATH.operator];

const SIGN_PATHS = [...AGENT_PATHS, ...OPERATOR_PATHS, config.PATH.creator];

const REQUEST_AUTH_PATHS = [
  ...SIGN_PATHS,
  ...PASSWORD_PATHS,
  ...PIN_PATHS,
  config.PATH.app,
  config.PATH.ticket,
  config.PATH.creator,
  config.PATH.operator,
  config.PATH.agent
];

export const backupAuthToken = (cookies: Cookies, tokenName: string) => {
  const authToken = cookies.get(tokenName);
  if (authToken) {
    setAuthToken(cookies, `${tokenName}-tmp`, authToken);
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

//#region isMatch
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
//#endregion

export const restoreAuthToken = (cookies: Cookies, tokenName: string) => {
  const authToken = cookies.get(`${tokenName}-tmp`);
  if (authToken) {
    setAuthToken(cookies, tokenName, authToken);
    deleteAuthToken(cookies, `${tokenName}-tmp`);
  }
};

export const setAuthToken = (
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

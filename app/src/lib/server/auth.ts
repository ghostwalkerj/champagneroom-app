import outmatch from 'outmatch';
import * as web3 from 'web3';

import {
  BITCART_INVOICE_NOTIFICATION_PATH,
  BITCART_PAYOUT_NOTIFICATION_PATH
} from '$env/static/private';
import {
  PUBLIC_API_PATH,
  PUBLIC_APP_PATH,
  PUBLIC_AUTH_PATH,
  PUBLIC_CREATOR_PATH,
  PUBLIC_SHOW_PATH,
  PUBLIC_SHOWTIME_PATH,
  PUBLIC_SIGNUP_PATH,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

const idString = '/[A-Za-z0-9_-]*';

const PASSWORD_PATHS = [
  PUBLIC_CREATOR_PATH + idString,
  PUBLIC_CREATOR_PATH + idString + PUBLIC_SHOWTIME_PATH,
  '!' + PUBLIC_CREATOR_PATH + PUBLIC_SHOWTIME_PATH
];
const PIN_PATHS = [
  PUBLIC_TICKET_PATH + idString,
  PUBLIC_TICKET_PATH + idString + PUBLIC_SHOWTIME_PATH
];

const PROTECTED_PATHS = [PUBLIC_APP_PATH + '/**', PUBLIC_API_PATH + '/**'];

const WHITELIST_PATHS = [
  PUBLIC_SHOW_PATH + '/**',
  PUBLIC_AUTH_PATH,
  PUBLIC_SIGNUP_PATH,
  BITCART_INVOICE_NOTIFICATION_PATH + idString,
  BITCART_PAYOUT_NOTIFICATION_PATH + idString
];

const NOTIFICATION_PATHS = [
  BITCART_INVOICE_NOTIFICATION_PATH + idString,
  BITCART_PAYOUT_NOTIFICATION_PATH + idString
];

const APP_PATHS = [PUBLIC_APP_PATH + '/**'];
const API_PATHS = [PUBLIC_API_PATH + '/**'];

const TICKET_PATHS = [PUBLIC_TICKET_PATH + '/**'];
const CREATOR_PATHS = [PUBLIC_CREATOR_PATH, PUBLIC_CREATOR_PATH + '/**'];
const SECRET_PATHS = [...PASSWORD_PATHS, ...PIN_PATHS];

export const isAPIPathMatch = outmatch(API_PATHS);
export const isAppPathMatch = outmatch(APP_PATHS);
export const isCreatorMatch = outmatch(CREATOR_PATHS);
export const isNotificationMatch = outmatch(NOTIFICATION_PATHS);
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

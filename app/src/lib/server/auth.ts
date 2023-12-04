import outmatch from 'outmatch';
import * as web3 from 'web3';

import {
  BITCART_INVOICE_NOTIFICATION_PATH,
  BITCART_PAYOUT_NOTIFICATION_PATH
} from '$env/static/private';

import Config from '$lib/config';

const idString = '/[A-Za-z0-9_-]*';

const PASSWORD_PATHS = [
  Config.Path.creator + idString,
  Config.Path.creator + idString
];
const PIN_PATHS = [Config.Path.ticket + idString];

const PROTECTED_PATHS = [
  Config.Path.app + '/**',
  Config.Path.api + '/**',
  Config.Path.app,
  Config.Path.api
];

const NOTIFICATION_PATHS = [
  Config.Path.notifyUpdate + idString,
  Config.Path.notifyInsert + idString
];

const WEBHOOK_PATHS = [
  BITCART_INVOICE_NOTIFICATION_PATH + idString,
  BITCART_PAYOUT_NOTIFICATION_PATH + idString
];

const WHITELIST_PATHS = [
  Config.Path.show + '/**',
  Config.Path.auth,
  Config.Path.signout,
  Config.Path.signup + '/**',
  ...WEBHOOK_PATHS
];

const TICKET_PATHS = [Config.Path.ticket + '/**', Config.Path.ticket];
const CREATOR_PATHS = [
  Config.Path.creator,
  Config.Path.creator + '/**',
  Config.Path.imageUpload
];
const SECRET_PATHS = [...PASSWORD_PATHS, ...PIN_PATHS];
const AGENT_PATHS = [Config.Path.agent];
const OPERATOR_PATHS = [Config.Path.operator];

const SIGN_PATHS = [...AGENT_PATHS, ...OPERATOR_PATHS, Config.Path.creator];

const REQUEST_AUTH_PATHS = [
  ...SIGN_PATHS,
  ...PASSWORD_PATHS,
  ...PIN_PATHS,
  Config.Path.app,
  Config.Path.ticket,
  Config.Path.creator,
  Config.Path.operator,
  Config.Path.agent
];

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

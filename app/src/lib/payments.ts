import axios from 'axios';
import urlJoin from 'url-join';
import { isAddress } from 'web3-validator';
import { z } from 'zod';

import {
  createInvoiceInvoicesPost,
  createTokenTokenPost,
  modifyInvoiceInvoicesModelIdPatch
} from '$ext/bitcart';

import config from './config';
import { authEncrypt } from './crypt';
import type { DisplayInvoice } from './ext/bitcart/models';
import type { TransactionSummaryType } from './models/common';

const permissions = ['full_control'];

// Bitcart API types
export type BitcartConfig = {
  storeId: string;
  email: string;
  password: string;
  apiURL: string;
  authSalt: string;
  invoiceNotificationUrl: string;
};

export type PaymentType = {
  created: string;
  lightning: boolean;
  currency: string;
  amount: string;
  rate: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  payment_address: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  user_address: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  payment_url: string;
  confirmations: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  chain_id: number;
  id: string;
};

export enum InvoiceJobType {
  UPDATE = 'UPDATE',
  CANCEL = 'CANCEL',
  CREATE = 'CREATE',
  UPDATE_ADDRESS = 'UPDATE_ADDRESS'
}

export enum InvoiceStatus {
  PENDING = 'pending',
  COMPLETE = 'complete',
  INVALID = 'invalid',
  EXPIRED = 'expired',
  IN_PROGRESS = 'in progress',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PayoutJobType {
  REFUND_SHOW = 'REFUND SHOW',
  PAYOUT_UPDATE = 'PAYOUT UPDATE',
  CREATE_PAYOUT = 'CREATE PAYOUT',
  DISPUTE_PAYOUT = 'DISPUTE PAYOUT'
}

export enum PayoutReason {
  SHOW_REFUND = 'SHOW REFUND',
  CREATOR_PAYOUT = 'CREATOR PAYOUT',
  AGENT_PAYOUT = 'AGENT PAYOUT',
  DISPUTE = 'DISPUTE'
}

export enum PayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  SENT = 'sent',
  COMPLETE = 'complete'
}

/**
 * Calculates the total amount based on the payments provided.
 *
 * @param {Map<string, TransactionSummaryType[]>} payments - The map of payments with transaction summary types
 * @return {number} The total calculated amount
 */
export const calcTotal = (payments: Map<string, TransactionSummaryType[]>) => {
  let total = 0;

  for (const [, paymentArray] of payments.entries()) {
    total += paymentArray.reduce((accumulator, current) => {
      return accumulator + current.amount * current.rate;
    }, 0);
  }
  return total;
};

/**
 * Creates a Bitcart token using the provided email, password, and API URL.
 *
 * @param {string} email - The email associated with the Bitcart account.
 * @param {string} password - The password associated with the Bitcart account.
 * @param {string} apiURL - The URL of the Bitcart API.
 * @return {Promise<string>} A promise that resolves to the access token.
 * @throws {Error} If no data is returned from the Bitcart API or if no access token is returned.
 */
export const createBitcartToken = async (
  email: string,
  password: string,
  apiURL: string
) => {
  axios.defaults.baseURL = apiURL;

  const resp = await createTokenTokenPost({
    email,
    password,
    permissions
  });

  if (!resp.data) throw new Error('No data returned from Bitcart API');

  const accessToken = (resp.data as any)['access_token'];
  if (!accessToken)
    throw new Error('No access token returned from Bitcart API');

  return accessToken as string;
};

/**
 * Creates a ticket invoice by sending a request to the Bitcart API, updating the notification URL,
 * and modifying the invoice.
 *
 * @param {Object} ticket - The ticket object containing price and ID.
 * @param {string} token - The access token for authentication.
 * @param {BitcartConfig} bcConfig - The Bitcart configuration object.
 * @return {Promise<DisplayInvoice>} A promise that resolves to the created invoice.
 */
export const createTicketInvoice = async ({
  ticket,
  token,
  bcConfig
}: {
  ticket: {
    price: { amount: number; currency: string };
    _id: object | string;
  };
  token: string;
  bcConfig: BitcartConfig;
}) => {
  const response = await createInvoiceInvoicesPost(
    {
      price: ticket.price.amount,
      currency: ticket.price.currency,
      store_id: bcConfig.storeId,
      expiration: config.TIMER.paymentPeriod / 60 / 1000,
      order_id: ticket._id.toString()
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response || !response.data) {
    console.error('Invoice cannot be created');
    throw new Error('Invoice cannot be created');
  }

  // Update the notification url
  const invoice = response.data as DisplayInvoice;
  const encryptedInvoiceId =
    authEncrypt(
      invoice.id ? (invoice.id as string) : '',
      bcConfig.authSalt ?? ''
    ) ?? '';

  invoice.notification_url = urlJoin(
    bcConfig.invoiceNotificationUrl,
    encryptedInvoiceId
  );

  await modifyInvoiceInvoicesModelIdPatch(invoice.id!, invoice, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return invoice;
};

// Schemas
export const requestPayoutSchema = z.object({
  walletId: z.string(),
  destination: z.custom<string>((data) => {
    if (typeof data === 'string') {
      return isAddress(data);
    }
    return false;
  }, 'Invalid address'),
  amount: z.number().positive(),
  payoutReason: z.nativeEnum(PayoutReason),
  jobType: z.nativeEnum(PayoutJobType)
});

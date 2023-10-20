import axios from 'axios';

import type { TransactionSummaryType } from '$lib/models/transaction';

import { createTokenTokenPost } from '$ext/bitcart';

const permissions = ['full_control'];

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

// Bitcart API types
export enum InvoiceJobType {
  UPDATE = 'UPDATE',
  CANCEL = 'CANCEL'
}

export enum InvoiceStatus {
  PENDING = 'Pending',
  COMPLETE = 'complete',
  INVALID = 'invalid',
  EXPIRED = 'expired',
  IN_PROGRESS = 'In progress',
  FAILED = 'Failed',
  REFUNDED = 'refunded'
}

export enum PayoutJobType {
  CREATE_REFUND = 'CREATE REFUND',
  PAYOUT_UPDATE = 'PAYOUT UPDATE',
  CREATE_PAYOUT = 'CREATE PAYOUT'
}

export enum PayoutReason {
  REFUND = 'REFUND',
  CREATOR_PAYOUT = 'CREATOR PAYOUT'
}

export enum PayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  SENT = 'sent',
  COMPLETE = 'complete'
}

export const calcTotal = (payments: Map<string, TransactionSummaryType[]>) => {
  let total = 0;

  for (const key in Object.keys(payments)) {
    const paymentArray = payments[key] as [TransactionSummaryType];
    total += paymentArray.reduce((accumulator, current) => {
      return accumulator + current.amount * current.rate;
    }, 0);
  }
  return total;
};

export const createAuthToken = async (
  email: string,
  password: string,
  baseURL: string
) => {
  axios.defaults.baseURL = baseURL;

  const resp = await createTokenTokenPost({
    email,
    password,
    permissions
  });

  if (!resp.data) throw new Error('No data returned from Bitcart API');

  const accessToken = resp.data['access_token'];
  if (!accessToken)
    throw new Error('No access token returned from Bitcart API');

  return accessToken;
};

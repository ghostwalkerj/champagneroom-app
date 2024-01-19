import axios from 'axios';
import { isAddress } from 'web3-validator';
import { z } from 'zod';

import { createTokenTokenPost } from '$ext/bitcart';

import type { TransactionSummaryType } from './models/common';

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
  REFUND_SHOW = 'REFUND SHOW',
  PAYOUT_UPDATE = 'PAYOUT UPDATE',
  CREATE_PAYOUT = 'CREATE PAYOUT',
  DISPUTE_PAYOUT = 'DISPUTE PAYOUT'
}

export enum PayoutReason {
  SHOW_REFUND = 'SHOW REFUND',
  CREATOR_PAYOUT = 'CREATOR PAYOUT',
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

export const calcTotal = (payments: Map<string, TransactionSummaryType[]>) => {
  let total = 0;

  for (const [, paymentArray] of payments.entries()) {
    total += paymentArray.reduce((accumulator, current) => {
      return accumulator + current.amount * current.rate;
    }, 0);
  }
  return total;
};

export const createBitcartToken = async (
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

  const accessToken = (resp.data as any)['access_token'];
  if (!accessToken)
    throw new Error('No access token returned from Bitcart API');

  return accessToken;
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
  reason: z.nativeEnum(PayoutReason),
  jobType: z.nativeEnum(PayoutJobType)
});

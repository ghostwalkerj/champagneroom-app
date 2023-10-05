import axios from 'axios';

import { createTokenTokenPost } from '$ext/bitcart';

const permissions = ['full_control'];

export enum InvoiceJobType {
  UPDATE = 'UPDATE',
  INITIATE_PAYMENT = 'INITIATE_PAYMENT',
  CANCEL = 'CANCEL'
}

// Bitcart API types
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
  CREATE_REFUND = 'CREATE_REFUND',
  PAYOUT_UPDATE = 'PAYOUT_UPDATE'
}

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

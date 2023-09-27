import axios from 'axios';

import { createTokenTokenPost } from '$lib/bitcart';

const permissions = ['full_control'];

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

// Bitcart API types
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
};

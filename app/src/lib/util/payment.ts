import axios from 'axios';

import { BITCART_EMAIL, BITCART_PASSWORD } from '$env/static/private';
import { PUBLIC_BITCART_URL } from '$env/static/public';

import { createTokenTokenPost } from '$lib/bitcart';
axios.defaults.baseURL = PUBLIC_BITCART_URL;

const permissions = ['full_control'];

export const createAuthToken = async () => {
  const resp = await createTokenTokenPost({
    email: BITCART_EMAIL,
    password: BITCART_PASSWORD,
    permissions
  });

  if (!resp.data) throw new Error('No data returned from Bitcart API');

  const accessToken = resp.data['access_token'];
  if (!accessToken)
    throw new Error('No access token returned from Bitcart API');

  return accessToken;
};

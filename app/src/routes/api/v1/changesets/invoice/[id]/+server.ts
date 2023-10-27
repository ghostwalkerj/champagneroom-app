import { error } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';

import { BITCART_API_URL, BITCART_EMAIL, BITCART_PASSWORD } from '$env/static/private';

import { createAuthToken } from '$lib/payment';

import { getInvoiceByIdInvoicesModelIdGet } from '$ext/bitcart';
import type { DisplayInvoice } from '$ext/bitcart/models';

import type { RequestHandler } from './$types';

export const GET = (async ({ params }) => {
  const bcInvoiceId = params.id;
  if (!bcInvoiceId) {
    return new Response(undefined, { status: 400 });
  }

  // Get invoice associated with ticket
  const token = await createAuthToken(
    BITCART_EMAIL,
    BITCART_PASSWORD,
    BITCART_API_URL
  );

  const invoice =
    (bcInvoiceId &&
      ((await getInvoiceByIdInvoicesModelIdGet(bcInvoiceId, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })) as AxiosResponse<DisplayInvoice>)) ||
    undefined;

  if (!invoice) {
    throw error(404, 'Invoice not found');
  }

  return new Response(JSON.stringify(invoice.data));
}) satisfies RequestHandler;

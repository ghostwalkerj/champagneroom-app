import { error } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';

import { BITCART_EMAIL, BITCART_PASSWORD } from '$env/static/private';
import { PUBLIC_BITCART_API_URL } from '$env/static/public';

import { getInvoiceByIdInvoicesModelIdGet } from '$lib/bitcart';
import type { DisplayInvoice } from '$lib/bitcart/models';
import { createAuthToken } from '$lib/util/payment';

import type { RequestHandler } from './$types';

export const GET = (async ({ params }) => {
  const invoiceId = params.id;
  if (!invoiceId) {
    return new Response(undefined, { status: 400 });
  }

  // Get invoice associated with ticket
  const token = await createAuthToken(
    BITCART_EMAIL,
    BITCART_PASSWORD,
    PUBLIC_BITCART_API_URL
  );

  const invoice =
    (invoiceId &&
      ((await getInvoiceByIdInvoicesModelIdGet(invoiceId, {
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

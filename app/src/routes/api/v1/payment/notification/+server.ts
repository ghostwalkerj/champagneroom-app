import { error } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';
import type IORedis from 'ioredis';

import { BITCART_EMAIL, BITCART_PASSWORD } from '$env/static/private';
import { PUBLIC_BITCART_URL } from '$env/static/public';

import { Ticket } from '$lib/models/ticket';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import { getInvoiceByIdInvoicesModelIdGet } from '$lib/bitcart';
import type { DisplayInvoice } from '$lib/bitcart/models';
import { createAuthToken } from '$lib/util/payment';
import { getTicketMachineServiceFromId } from '$lib/util/util.server';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.formData();
  const invoiceId = body.get('id') as string;
  const status = body.get('status') as string;

  if (!invoiceId || !status) {
    return new Response(undefined, { status: 400 });
  }

  // Get invoice associated with ticket
  const token = await createAuthToken(
    BITCART_EMAIL,
    BITCART_PASSWORD,
    PUBLIC_BITCART_URL
  );

  const invoice = (await getInvoiceByIdInvoicesModelIdGet(invoiceId, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })) as AxiosResponse<DisplayInvoice>;

  if (!invoice) {
    throw error(404, 'Invoice not found');
  }

  const redisConnection = locals.redisConnection as IORedis;
  const ticketId = invoice.data.order_id as string;

  const ticketService = await getTicketMachineServiceFromId(
    ticketId,
    redisConnection
  );

  ticketService.send(TicketMachineEventString.INVOICE_STATUS_CHANGED, {
    invoice: invoice.data,
    status
  });

  return new Response(undefined, { status: 200 });
};

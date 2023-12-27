import { Queue } from 'bullmq';
import type IORedis from 'ioredis';

import { AUTH_SALT } from '$env/static/private';

import { EntityType } from '$lib/constants';
import { InvoiceJobType } from '$lib/payment';
import { authDecrypt } from '$lib/server/auth';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, params }) => {
  const body = await request.json();
  const encryptedToken = params.token;
  const bcInvoiceId = body['id'] as string;
  const status = body['status'] as string;
  const redisConnection = locals.redisConnection as IORedis;
  const token = authDecrypt(encryptedToken, AUTH_SALT);

  if (!token || token !== bcInvoiceId) {
    console.error('Invalid token for invoice notification');
    return new Response(undefined, { status: 200 });
  }

  if (!bcInvoiceId || !status) {
    console.error('Missing bcInvoiceId or status');
    return new Response(undefined, { status: 400 });
  }

  const invoiceQueue = new Queue(EntityType.INVOICE, {
    connection: redisConnection
  });

  invoiceQueue.add(InvoiceJobType.UPDATE, { bcInvoiceId, status });

  invoiceQueue.close();

  return new Response(undefined, { status: 200 });
};

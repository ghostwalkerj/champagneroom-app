import { Queue } from 'bullmq';
import type IORedis from 'ioredis';

import { EntityType } from '$lib/constants';
import { PayoutJobType } from '$lib/payment';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const bcPayoutId = body['id'] as string;
  const status = body['status'] as string;
  const redisConnection = locals.redisConnection as IORedis;

  if (!bcPayoutId || !status) {
    return new Response(undefined, { status: 400 });
  }

  const payoutQueue = new Queue(EntityType.PAYOUT, {
    connection: redisConnection
  });

  payoutQueue.add(PayoutJobType.PAYOUT_UPDATE, { bcPayoutId, status });
  return new Response(undefined, { status: 200 });
};

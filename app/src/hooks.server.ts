import type { Handle } from '@sveltejs/kit';
import IORedis from 'ioredis';
import mongoose from 'mongoose';

import {
    MONGO_DB_ENDPOINT,
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_PORT,
    REDIS_USERNAME
} from '$env/static/private';

mongoose.connect(MONGO_DB_ENDPOINT);
const redisConnection = new IORedis({
  host: REDIS_HOST,
  port: +REDIS_PORT,
  password: REDIS_PASSWORD,
  username: REDIS_USERNAME,
  enableReadyCheck: false,
  maxRetriesPerRequest: undefined
});

export const handle = (async ({ event, resolve }) => {
  event.locals.redisConnection = redisConnection;
  const response = await resolve(event);
  return response;
}) satisfies Handle;

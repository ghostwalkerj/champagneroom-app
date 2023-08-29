import type { Cookies, Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import axios from 'axios';
import IORedis from 'ioredis';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import {
  JWT_PRIVATE_KEY,
  MONGO_DB_ENDPOINT,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_USERNAME
} from '$env/static/private';
import {
  PUBLIC_AGENT_PATH,
  PUBLIC_AUTH_PATH,
  PUBLIC_BITCART_URL,
  PUBLIC_CREATOR_PATH,
  PUBLIC_OPERATOR_PATH
} from '$env/static/public';

import { EntityType } from '$lib/constants';
const authUrl = PUBLIC_AUTH_PATH;


await mongoose.connect(MONGO_DB_ENDPOINT);
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
  const requestedPath = event.url.pathname;
  const address = event.params.address as string;
  const cookies = event.cookies;

  const role = requestedPath.startsWith(PUBLIC_AGENT_PATH)
    ? EntityType.AGENT
    : requestedPath.startsWith(PUBLIC_CREATOR_PATH)
    ? EntityType.CREATOR
    : requestedPath.startsWith(PUBLIC_OPERATOR_PATH)
    ? EntityType.OPERATOR
    : EntityType.NONE;

  // Restrict paths to only those that are allowed
  // Path is restricted and address is in the route
  if (
    address &&
    (role === EntityType.AGENT ||
      role === EntityType.CREATOR ||
      role === EntityType.OPERATOR)
  ) {
    // Check if valid session exists
    const tokenName = role.toLowerCase() + 'AuthToken';
    const authToken = cookies.get(tokenName);

    if (!authToken) {
      needAuth(role, tokenName, address, cookies);
      throw redirect(302, authUrl);
    }

    try {
      const decode = jwt.verify(authToken, JWT_PRIVATE_KEY) as JwtPayload;
      if (!decode.address || decode.address !== address) {
        needAuth(role, tokenName, address, cookies);
        throw redirect(302, authUrl);
      }
    } catch {
      needAuth(role, tokenName, address, cookies);
      throw redirect(302, authUrl);
    }
  }

  const response = await resolve(event);
  return response;
}) satisfies Handle;

export const needAuth = (
  role: EntityType,
  tokenName: string,
  address: string,
  cookies: Cookies
) => {
  cookies.set('role', role, { path: authUrl });
  cookies.set('tokenName', tokenName, { path: authUrl });
  cookies.set('address', address, { path: authUrl });
  cookies.delete(tokenName, { path: '/' });
};

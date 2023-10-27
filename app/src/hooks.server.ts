import console from 'node:console';

import type { Cookies, Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import IORedis from 'ioredis';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import {
  AUTH_TOKEN_NAME,
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
  PUBLIC_CREATOR_PATH,
  PUBLIC_CREATOR_SIGNUP_PATH,
  PUBLIC_OPERATOR_PATH
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import { Operator } from '$lib/models/operator';
import { User, UserRole } from '$lib/models/user';

const authUrl = PUBLIC_AUTH_PATH;
const signupUrl = PUBLIC_CREATOR_SIGNUP_PATH;

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
  const requestedPath = event.url.pathname;
  const address = event.params.address as string;
  const cookies = event.cookies;
  const locals = event.locals;
  const returnPath = event.url.href;

  locals.redisConnection = redisConnection;

  // Restrict paths to only those that are allowed
  // Path is restricted and address is in the route
  if (address) {
    // Check if valid session exists
    const tokenName = AUTH_TOKEN_NAME || 'token';
    const authToken = cookies.get(tokenName);

    const setAuthCookie = () => {
      cookies.set('address', address, { path: authUrl });
      cookies.set('returnPath', returnPath, { path: authUrl });
    };
    setAuthCookie();

    if (!authToken) {
      console.error('No auth token');
      throw redirect(302, authUrl);
    }

    try {
      const decode = jwt.verify(authToken, JWT_PRIVATE_KEY) as JwtPayload;
      if (!decode.address || decode.address !== address) {
        console.error('Invalid auth token');
        throw redirect(302, authUrl);
      } // authenticated user
      else {
        // Check if user is allowed to access the requested path
        const user = await User.findOne({ address: decode.address });
        if (!user) {
          console.error('No user');
          throw redirect(302, signupUrl);
        }

        locals.user = user;
        const allowedPaths = [PUBLIC_AUTH_PATH];
        for (const role of user.roles) {
          switch (role) {
            case UserRole.AGENT: {
              allowedPaths.push(PUBLIC_AGENT_PATH);
              const agent = await Agent.findOne({ user: user._id });
              if (!agent) {
                console.error('No agent');
                throw redirect(302, authUrl);
              }
              locals.agent = agent;
              break;
            }
            case UserRole.CREATOR: {
              allowedPaths.push(PUBLIC_CREATOR_PATH);
              const creator = await Creator.findOne({ user: user._id });
              if (!creator) {
                console.error('No creator');
                throw redirect(302, authUrl);
              }
              locals.creator = creator;
              break;
            }
            case UserRole.OPERATOR: {
              allowedPaths.push(PUBLIC_OPERATOR_PATH);
              const operator = await Operator.findOne({ user: user._id });
              if (!operator) {
                console.error('No operator');
                throw redirect(302, authUrl);
              }
              locals.operator = operator;
              break;
            }
          }
        }
        if (!allowedPaths.some((path) => requestedPath.startsWith(path))) {
          console.error('Not allowed');
          console.log(requestedPath);
          console.log(allowedPaths);
          throw redirect(302, signupUrl);
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  const response = await resolve(event);
  return response;
}) satisfies Handle;

import console from 'node:console';

import type { Handle } from '@sveltejs/kit';
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
  PUBLIC_OPERATOR_PATH,
  PUBLIC_SIGNUP_PATH
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import { Operator } from '$lib/models/operator';
import { User, UserRole } from '$lib/models/user';

import { APP_PATH, PATH_WHITELIST, verifyPath } from '$lib/server/auth';

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
  const requestedPath = event.url.pathname;
  const address = event.params.address as string;
  const cookies = event.cookies;
  const locals = event.locals;
  let returnPath = requestedPath;
  if (returnPath === authUrl) {
    returnPath = '/';
  }

  locals.redisConnection = redisConnection;

  // Auth stuff only run in APP_PATH
  if (requestedPath.startsWith(APP_PATH)) {
    const tokenName = AUTH_TOKEN_NAME || 'token';
    const authToken = cookies.get(tokenName);
    cookies.set('returnPath', returnPath, { path: authUrl });

    if (address) {
      // Check if valid session exists
      const setAuthCookie = () => {
        cookies.set('address', address, { path: authUrl });
      };
      setAuthCookie();
    }

    try {
      const allowedPaths = [...PATH_WHITELIST];

      // If authenticated, check if user is allowed to access the requested path and set user in locals
      if (authToken) {
        let decode: JwtPayload;
        try {
          decode = jwt.verify(authToken, JWT_PRIVATE_KEY) as JwtPayload;
        } catch (error) {
          console.error('Invalid token:', error);
          cookies.delete(tokenName, { path: '/' });
          throw redirect(302, authUrl);
        }
        if (decode.address) {
          // Check if user is allowed to access the requested path
          const user = await User.findOne({ address: decode.address });
          if (!user) {
            console.error('No user');
            throw 'No user';
          }
          locals.user = user;

          for (const role of user.roles) {
            switch (role) {
              case UserRole.AGENT: {
                allowedPaths.push(PUBLIC_AGENT_PATH);
                const agent = await Agent.findOne({ user: user._id });
                if (!agent) {
                  console.error('No agent');
                  throw 'No agent';
                }
                locals.agent = agent;
                break;
              }
              case UserRole.CREATOR: {
                allowedPaths.push(PUBLIC_CREATOR_PATH);
                const creator = await Creator.findOne({ user: user._id });
                if (!creator) {
                  console.error('No creator');
                  throw 'No creator';
                }
                locals.creator = creator;
                break;
              }
              case UserRole.OPERATOR: {
                allowedPaths.push(PUBLIC_OPERATOR_PATH);
                const operator = await Operator.findOne({ user: user._id });
                if (!operator) {
                  console.error('No operator');
                  throw 'No operator';
                }
                locals.operator = operator;
                break;
              }
            }
          }
        }
      }
      if (verifyPath(requestedPath, allowedPaths)) {
        console.log('Allowed');
      } else {
        console.error('Not allowed');
        throw redirect(302, authUrl);
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  const response = await resolve(event);
  return response;
}) satisfies Handle;

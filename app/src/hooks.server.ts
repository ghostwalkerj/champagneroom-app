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
  PUBLIC_SIGNUP_PATH,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import { Operator } from '$lib/models/operator';
import { Ticket } from '$lib/models/ticket';
import { AuthType, User, UserRole } from '$lib/models/user';

import {
  decryptFromCookie,
  encrypt4Cookie,
  isProtectedMatch,
  isWhitelistMatch
} from '$lib/server/auth';

const authUrl = PUBLIC_AUTH_PATH;
const signUpUrl = PUBLIC_SIGNUP_PATH;

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
  const cookies = event.cookies;
  const locals = event.locals;
  const returnPath = requestedPath;

  locals.redisConnection = redisConnection;

  // Auth run in protected path
  if (isProtectedMatch(requestedPath)) {
    const tokenName = AUTH_TOKEN_NAME || 'token';
    const encryptedToken = cookies.get(tokenName);
    const allowedPaths = [] as string[];

    if (requestedPath === authUrl) {
      cookies.delete(tokenName, { path: '/' });
    } else {
      const authToken = decryptFromCookie(encryptedToken);

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
        const selector = decode.selector;

        if (selector) {
          const query = {};
          query[selector] = decode[selector];

          // Check if user is allowed to access the requested path
          const user = await User.findOne(query);
          if (!user) {
            console.error('No user');
            throw redirect(302, signUpUrl);
          }
          locals.user = user;

          // load any associated roles
          for (const role of user.roles) {
            switch (role) {
              case UserRole.AGENT: {
                allowedPaths.push(PUBLIC_AGENT_PATH);
                const agent = await Agent.findOne({ user: user._id });
                if (!agent) {
                  console.error('No agent');
                  throw redirect(302, signUpUrl);
                }
                locals.agent = agent;
                break;
              }
              case UserRole.CREATOR: {
                let path = PUBLIC_CREATOR_PATH;
                if (user.authType === AuthType.PASSWORD_SECRET) {
                  path = `${path}/${user[selector]}`;
                }
                allowedPaths.push(path);
                const creator = await Creator.findOne({ user: user._id });
                if (!creator) {
                  console.error('No creator');
                  throw redirect(302, signUpUrl);
                }
                locals.creator = creator;
                break;
              }
              case UserRole.OPERATOR: {
                allowedPaths.push(PUBLIC_OPERATOR_PATH);
                const operator = await Operator.findOne({ user: user._id });
                if (!operator) {
                  console.error('No operator');
                  throw redirect(302, signUpUrl);
                }
                locals.operator = operator;
                break;
              }
              case UserRole.TICKET_HOLDER: {
                const ticket = await Ticket.findOne({
                  user: user._id
                });
                if (!ticket) {
                  console.error('No ticket');
                  throw redirect(302, signUpUrl);
                }
                locals.ticket = ticket;
                const ticketPath = `${PUBLIC_TICKET_PATH}/${ticket._id}`;
                allowedPaths.push(ticketPath);
              }
            }
          }
        }
      }
    }
    if (
      isWhitelistMatch(requestedPath) ||
      allowedPaths.includes(requestedPath)
    ) {
      console.log(requestedPath, ': Allowed');
    } else {
      console.log(requestedPath, ': Not Allowed');
      const encReturnPath = encrypt4Cookie(returnPath);
      encReturnPath &&
        cookies.set('returnPath', encReturnPath, { path: authUrl });
      throw redirect(302, authUrl);
    }
  }

  const response = await resolve(event);
  return response;
}) satisfies Handle;

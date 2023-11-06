import console from 'node:console';

import type { Handle } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import IORedis from 'ioredis';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import urlJoin from 'url-join';

import {
  AUTH_SALT,
  AUTH_TOKEN_NAME,
  JWT_PRIVATE_KEY,
  MONGO_DB_ENDPOINT,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_USERNAME
} from '$env/static/private';
import {
  PUBLIC_AUTH_PATH,
  PUBLIC_CREATOR_PATH,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import { Operator } from '$lib/models/operator';
import { Show } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import type { UserDocument } from '$lib/models/user';
import { User, UserRole } from '$lib/models/user';
import type { WalletDocument } from '$lib/models/wallet';

import { authDecrypt } from '$lib/crypt';
import {
  isAgentMatch,
  isCreatorMatch,
  isNotificationMatch,
  isOperatorMatch,
  isPasswordMatch,
  isPinMatch,
  isProtectedMatch,
  isRequestAuthMatch,
  isWhitelistMatch
} from '$lib/server/auth';

const authUrl = PUBLIC_AUTH_PATH;

if (mongoose.connection.readyState === 0) mongoose.connect(MONGO_DB_ENDPOINT);
const redisConnection = new IORedis({
  host: REDIS_HOST,
  port: +REDIS_PORT,
  password: REDIS_PASSWORD,
  username: REDIS_USERNAME,
  enableReadyCheck: false,
  maxRetriesPerRequest: undefined
});

const setLocals = async (decode: JwtPayload, locals: App.Locals) => {
  const selector = decode.selector;
  if (selector) {
    const query = {};
    query[selector] = decode[selector];

    // Check if user is allowed to access the requested path
    const user = (await User.findOne(query).populate<{
      wallet: WalletDocument;
    }>('wallet')) as UserDocument & { wallet: WalletDocument };
    if (!user) {
      console.error('No user');
      console.log('query', query);
      throw error(500, 'No user');
    }
    locals.user = user;
    locals.wallet = user.wallet;

    // load any associated roles
    for (const role of user.roles) {
      switch (role) {
        case UserRole.AGENT: {
          const agent = await Agent.findOne({ user: user._id });
          if (!agent) {
            console.error('No agent');
            throw error(500, 'No agent');
          }
          locals.agent = agent;
          break;
        }

        case UserRole.CREATOR: {
          const creator = await Creator.findOne({ user: user._id });
          if (!creator) {
            console.error('No creator');
            throw error(500, 'No creator');
          }
          locals.creator = creator;

          // Current Shows can be watched
          const show = await Show.findOne({
            creator: creator._id,
            'showState.current': true
          }).exec();
          if (show) locals.currentShow = show;
          break;
        }

        case UserRole.OPERATOR: {
          const operator = await Operator.findOne({ user: user._id });
          if (!operator) {
            console.error('No operator');
            throw error(500, 'No operator');
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
            throw error(500, 'No ticket');
          }
          locals.ticket = ticket;
          break;
        }
      }
    }
  }

  return locals;
};

const allowedPath = (path: string, locals: App.Locals, selector?: string) => {
  if (isWhitelistMatch(path)) return true;

  if (!locals.user) return false;

  const slug =
    selector === undefined ? undefined : locals.user[selector].toString();

  // If the user is a creator, they can access their own page
  if (isPasswordMatch(path)) {
    return locals.creator && path === `${PUBLIC_CREATOR_PATH}/${slug}`;
  }

  // If the user is a ticket holder, they can access their own ticket
  if (isPinMatch(path)) {
    return (
      locals.ticket &&
      path === `${PUBLIC_TICKET_PATH}/${locals.ticket._id.toString()}`
    );
  }
  // If the user is an agent, operator, creator they can access their own page
  if (isOperatorMatch(path) && locals.operator) return true;
  if (isAgentMatch(path) && locals.agent) return true;
  if (isCreatorMatch(path) && locals.creator) return true;

  // Notifications can be accessed by the creator, ticket holder, agent, operator
  if (isNotificationMatch(path)) {
    const allowedIds: string[] = [];
    if (locals.creator) allowedIds.push(locals.creator._id.toString());
    if (locals.ticket)
      allowedIds.push(
        locals.ticket._id.toString(),
        locals.ticket.show.toString()
      );
    if (locals.wallet) allowedIds.push(locals.wallet._id.toString());
    if (locals.agent) allowedIds.push(locals.agent._id.toString());
    if (locals.operator) allowedIds.push(locals.operator._id.toString());
    if (locals.currentShow) allowedIds.push(locals.currentShow._id.toString());

    if (allowedIds.some((id) => path.includes(id))) return true;
  }
  return false;
};

export const handle = (async ({ event, resolve }) => {
  const requestedPath = event.url.pathname;
  const cookies = event.cookies;
  const locals = event.locals;

  locals.redisConnection = redisConnection;
  const tokenName = AUTH_TOKEN_NAME || 'token';
  const encryptedToken = cookies.get(tokenName);
  const authToken = authDecrypt(encryptedToken, AUTH_SALT);
  let selector: string | undefined;

  // Set locals
  if (authToken) {
    let decode: JwtPayload;
    try {
      decode = jwt.verify(authToken, JWT_PRIVATE_KEY) as JwtPayload;
      selector = decode.selector;
      await setLocals(decode, locals);
    } catch (error) {
      console.error('Invalid token:', error);
      cookies.delete(tokenName, { path: '/' });
      throw redirect(302, urlJoin(authUrl, '?returnPath=', requestedPath));
    }
  }
  if (
    isProtectedMatch(requestedPath) &&
    !allowedPath(requestedPath, locals, selector)
  ) {
    if (isRequestAuthMatch(requestedPath)) {
      throw redirect(302, urlJoin(authUrl, '?returnPath=', requestedPath));
    }
    throw error(403, 'Forbidden');
  } else {
    const response = await resolve(event);
    return response;
  }
}) satisfies Handle;

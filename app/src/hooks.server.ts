import type { Handle } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
// eslint-disable-next-line @typescript-eslint/naming-convention
import IORedis from 'ioredis';
import type { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { setup } from 'mongoose-zod';
import urlJoin from 'url-join';

import { env } from '$env/dynamic/private';

import type { AgentDocument } from '$lib/models/agent';
import { Agent } from '$lib/models/agent';
import type { CreatorDocument } from '$lib/models/creator';
import { Creator } from '$lib/models/creator';
import type { OperatorDocument } from '$lib/models/operator';
import { Operator } from '$lib/models/operator';
import { Room } from '$lib/models/room';
import { Show, type ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';
import type { UserDocument } from '$lib/models/user';
import { User } from '$lib/models/user';
import { Wallet, type WalletDocument } from '$lib/models/wallet';

// eslint-disable-next-line @typescript-eslint/naming-convention
import config from '$lib/config';
import { UserRole } from '$lib/constants';
import {
  deleteAuthToken,
  getAuthToken,
  isAgentMatch,
  isCreatorMatch,
  isNotificationMatch,
  isOperatorMatch,
  isPasswordMatch,
  isProtectedMatch,
  isRequestAuthMatch,
  isTicketMatch,
  isWhitelistMatch
} from '$lib/server/auth';

const authUrl = config.PATH.auth;

if (mongoose.connection.readyState === 0) {
  if (env.MONGO_DB_ENDPOINT === undefined) {
    throw new Error('MONGO_DB_ENDPOINT is not defined');
  }
  await mongoose.connect(env.MONGO_DB_ENDPOINT);
  setup({
    defaultToMongooseSchemaOptions: { unknownKeys: 'strip' }
  });
  mongoose.set('strictQuery', true);
}

const redisConnection = new IORedis({
  host: env.REDIS_HOST,
  port: +(env.REDIS_PORT ?? 6379),
  password: env.REDIS_PASSWORD,
  username: env.REDIS_USERNAME,
  enableReadyCheck: false,
  maxRetriesPerRequest: undefined
});

const setLocals = async (decode: JwtPayload, locals: App.Locals) => {
  const selector = decode.selector as string;
  if (selector) {
    const query: Record<string, unknown> = {};
    query[selector] = decode[selector];

    // Check if user is allowed to access the requested path
    const user = (await User.findOne(query)) as UserDocument;
    if (!user) {
      console.error('No user');
      throw error(500, 'No user');
    }
    locals.user = user;
    const wallet = await Wallet.findById(user.wallet);
    locals.wallet = wallet as WalletDocument;

    // load any associated roles
    for (const role of user.roles) {
      switch (role) {
        case UserRole.AGENT: {
          const agent = (await Agent.findOne({
            user: user._id
          })) as AgentDocument;
          if (!agent) {
            console.error('No agent');
            throw error(500, 'No agent');
          }
          locals.agent = agent;
          break;
        }

        case UserRole.CREATOR: {
          const creator = (await Creator.findOne({
            user: user._id
          })) as CreatorDocument;
          if (!creator) {
            console.error('No creator');
            throw error(500, 'No creator');
          }
          locals.creator = creator;

          // Current Shows can be watched
          const show = (await Show.findOne({
            creator: creator._id,
            'showState.current': true
          }).exec()) as ShowDocument;
          if (show) locals.show = show;

          // Room can be passed
          if (creator) {
            const room = await Room.findById(creator.room).exec();
            if (room) locals.room = room;
          }
          break;
        }

        case UserRole.OPERATOR: {
          const operator = (await Operator.findOne({
            user: user._id
          })) as OperatorDocument;
          if (!operator) {
            console.error('No operator');
            throw error(500, 'No operator');
          }
          locals.operator = operator;
          break;
        }

        case UserRole.TICKET_HOLDER: {
          const ticket = (await Ticket.findOne({
            user: user._id
          })) as TicketDocument;
          if (!ticket) {
            console.error('No ticket');
            throw error(500, 'No ticket');
          }
          locals.ticket = ticket;

          const show = (await Show.findById(ticket.show)
            .orFail(() => {
              throw error(500, 'Show not found');
            })
            .exec()) as ShowDocument;
          locals.show = show;
          break;
        }
      }
    }
  }

  if (decode.authType) locals.authType = decode.authType;

  return locals;
};

const allowedPath = (path: string, locals: App.Locals, selector?: string) => {
  if (isWhitelistMatch(path)) return true;

  if (!locals.user) return false;

  const slug =
    selector === undefined
      ? undefined
      : locals.user[selector as keyof typeof locals.user]?.toString();

  // If the user is a creator, they can access their own page
  if (isPasswordMatch(path)) {
    const creatorUrl = `${config.PATH.creator}/${slug}`;
    return locals.creator && path.startsWith(creatorUrl);
  }

  // If the user is a ticket holder, they can access their own ticket
  if (isTicketMatch(path)) {
    return locals.ticket !== undefined;
  }
  // If the user is an agent, operator, creator they can access their own page
  if (isOperatorMatch(path) && locals.operator) return true;
  if (isAgentMatch(path) && locals.agent) return true;
  if (isCreatorMatch(path) && locals.creator) return true;
  if (path === config.PATH.app && locals.user) return true;

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
    if (locals.show) allowedIds.push(locals.show._id.toString());
    if (locals.room) allowedIds.push(locals.room._id.toString());

    if (allowedIds.some((id) => path.includes(id))) return true;
  }
  return false;
};

export const handle = (async ({ event, resolve }) => {
  const requestedPath = event.url.pathname;
  const cookies = event.cookies;
  const locals = event.locals;

  locals.redisConnection = redisConnection;
  const tokenName = env.AUTH_TOKEN_NAME || 'token';
  let selector: string | undefined;

  const redirectPath = encodeURIComponent(requestedPath);

  // Set locals
  try {
    const decode = getAuthToken(cookies, tokenName);
    if (decode) {
      selector = decode.selector;
      await setLocals(decode, locals);
    }
  } catch (error) {
    console.error('Invalid token:', error);
    deleteAuthToken(cookies, tokenName);
    throw redirect(302, urlJoin(authUrl, '?returnPath=' + redirectPath));
  }

  if (
    isProtectedMatch(requestedPath) &&
    !allowedPath(requestedPath, locals, selector)
  ) {
    if (isRequestAuthMatch(requestedPath)) {
      throw redirect(302, urlJoin(authUrl, '?returnPath=' + redirectPath));
    }
    throw error(403, 'Forbidden');
  } else {
    const response = await resolve(event);
    return response;
  }
}) satisfies Handle;

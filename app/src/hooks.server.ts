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
  PUBLIC_AGENT_PATH,
  PUBLIC_AUTH_PATH,
  PUBLIC_CHANGESET_PATH,
  PUBLIC_CREATOR_PATH,
  PUBLIC_IMAGE_UPDATE_PATH,
  PUBLIC_INVOICE_PATH,
  PUBLIC_OPERATOR_PATH,
  PUBLIC_SHOWTIME_PATH,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import { Operator } from '$lib/models/operator';
import { Show } from '$lib/models/show';
import { Ticket, TicketStatus } from '$lib/models/ticket';
import { User, UserRole } from '$lib/models/user';

import { AuthType } from '$lib/constants';
import { authDecrypt } from '$lib/crypt';
import {
  isAppPathMatch,
  isProtectedMatch,
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
      const authToken = authDecrypt(encryptedToken, AUTH_SALT);

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
            console.log('query', query);
            throw error(500, 'No user');
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
                  throw error(500, 'No agent');
                }
                locals.agent = agent;
                break;
              }

              case UserRole.CREATOR: {
                let path = PUBLIC_CREATOR_PATH;
                if (user.authType === AuthType.PATH_PASSWORD) {
                  path = `${path}/${user[selector]}`;
                }
                const creator = await Creator.findOne({ user: user._id });
                if (!creator) {
                  console.error('No creator');
                  throw error(500, 'No creator');
                }
                locals.creator = creator;

                // Allow API paths for creators
                allowedPaths.push(
                  path,
                  urlJoin(
                    PUBLIC_CHANGESET_PATH,
                    'creator',
                    creator._id.toString()
                  ),
                  PUBLIC_IMAGE_UPDATE_PATH, // photos!
                  urlJoin(path, PUBLIC_SHOWTIME_PATH) // shows
                );

                // Current Shows can be watched
                const show = await Show.exists({
                  creator: creator._id,
                  'showState.current': true
                }).exec();
                if (show) {
                  allowedPaths.push(
                    urlJoin(PUBLIC_CHANGESET_PATH, 'show', show._id.toString()),
                    urlJoin(
                      PUBLIC_CHANGESET_PATH,
                      'showEvent',
                      show._id.toString()
                    )
                  );
                }

                // Wallet
                if (user.wallet) {
                  allowedPaths.push(
                    urlJoin(
                      PUBLIC_CHANGESET_PATH,
                      'wallet',
                      user.wallet.toString()
                    )
                  );
                }
                break;
              }

              case UserRole.OPERATOR: {
                allowedPaths.push(PUBLIC_OPERATOR_PATH); // super user
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
                const ticketPath = `${PUBLIC_TICKET_PATH}/${ticket._id}`;

                // Allow API paths for ticket holders
                allowedPaths.push(
                  ticketPath,
                  urlJoin(
                    PUBLIC_CHANGESET_PATH,
                    'ticket',
                    ticket._id.toString()
                  ),
                  urlJoin(PUBLIC_CHANGESET_PATH, 'show', ticket.show.toString())
                );
                if (ticket.bcInvoiceId) {
                  allowedPaths.push(
                    urlJoin(PUBLIC_INVOICE_PATH, ticket.bcInvoiceId.toString())
                  );
                }
                if (
                  ticket.ticketState.status === TicketStatus.FULLY_PAID ||
                  ticket.ticketState.status === TicketStatus.REDEEMED
                ) {
                  allowedPaths.push(urlJoin(ticketPath, PUBLIC_SHOWTIME_PATH));
                }
                break;
              }
            }
          }
        }
      }
    }
    console.log('allowedPaths', allowedPaths);

    if (
      isWhitelistMatch(requestedPath) ||
      allowedPaths.includes(requestedPath)
    ) {
      console.log(requestedPath, ': Allowed');
    } else {
      console.log(requestedPath, ': Not Allowed');
      // Redirect for auth if in app
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const _error = isAppPathMatch(requestedPath)
        ? redirect(302, urlJoin(authUrl, '?returnPath=', returnPath))
        : error(403, 'Forbidden');
      throw _error;
    }
  }

  const response = await resolve(event);

  return response;
}) satisfies Handle;

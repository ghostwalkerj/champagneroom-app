import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY
} from '$env/static/private';
import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

import { Show } from '$lib/models/show';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import Config from '$lib/config';
import { getTicketMachineService } from '$lib/server/machinesUtil';

import type { PageServerLoad } from './$types';

export const actions: Actions = {
  leave_show: async ({ locals }) => {
    const ticket = locals.ticket;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }
    const redisConnection = locals.redisConnection as IORedis;
    const ticketService = getTicketMachineService(ticket, redisConnection);
    ticketService.send(TicketMachineEventString.SHOW_LEFT);
    console.log('Ticket left show');
    return { success: true };
  }
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: PageServerLoad = async ({ locals, url }) => {
  const returnPath = url.searchParams.get('returnPath');

  const ticket = locals.ticket;
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }
  if (!ticket) {
    throw error(404, 'Ticket not found');
  }

  const show = locals.show;
  if (!show) {
    throw error(404, 'Show not found');
  }

  const jitsiToken = jwt.sign(
    {
      aud: 'jitsi',
      iss: JITSI_APP_ID,
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      sub: PUBLIC_JITSI_DOMAIN,
      room: show.roomId,
      context: {
        user: {
          name: user.name,
          affiliation: 'member',
          lobby_bypass: false
        }
      }
    },
    JITSI_JWT_SECRET
  );

  return {
    jitsiToken,
    ticket: ticket.toObject({
      flattenObjectIds: true,
      flattenMaps: true
    }),
    show: show.toObject({ flattenObjectIds: true, flattenMaps: true }),
    user: user.toObject({ flattenObjectIds: true, flattenMaps: true }),
    returnPath
  };
};

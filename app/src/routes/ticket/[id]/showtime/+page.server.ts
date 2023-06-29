import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';
import { waitFor } from 'xstate/lib/waitFor';

import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY
} from '$env/static/private';
import {
  PUBLIC_JITSI_DOMAIN,
  PUBLIC_PIN_PATH,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

import { Show } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import { verifyPin } from '$lib/util/pin';
import { getTicketMachineService } from '$lib/util/util.server';

import type { PageServerLoad } from './$types';

export const actions: Actions = {
  leave_show: async ({ params, cookies, locals }) => {
    const ticketId = params.id as string;
    const pinHash = cookies.get('pin');

    if (ticketId === null) {
      throw error(404, 'Bad ticket id');
    }

    const ticket = await Ticket.findById(ticketId)
      .orFail(() => {
        throw error(404, 'Ticket not found');
      })
      .exec();

    if (pinHash && verifyPin(ticketId, ticket.pin, pinHash)) {
      const redisConnection = locals.redisConnection as IORedis;
      const ticketService = getTicketMachineService(ticket, redisConnection);
      ticketService.send(TicketMachineEventString.SHOW_LEFT);
    }
    return { success: true };
  }
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: PageServerLoad = async ({ params, cookies, locals }) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const ticketUrl = urlJoin(PUBLIC_TICKET_PATH, ticketId);
  const pinUrl = urlJoin(ticketUrl, PUBLIC_PIN_PATH);

  if (!pinHash) {
    throw redirect(302, pinUrl);
  }
  if (ticketId === null) {
    throw error(404, 'Bad ticket id');
  }

  const ticket = await Ticket.findById(ticketId)
    .orFail(() => {
      throw error(404, 'Ticket not found');
    })
    .exec();

  const show = await Show.findById(ticket.show)
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();
  // Check if pin is correct
  if (!verifyPin(ticketId, ticket.pin, pinHash)) {
    throw redirect(302, pinUrl);
  }

  const redisConnection = locals.redisConnection as IORedis;

  const ticketService = getTicketMachineService(ticket, redisConnection);
  const ticketMachineState = ticketService.getSnapshot();

  if (ticketMachineState.can(TicketMachineEventString.TICKET_REDEEMED)) {
    ticketService.send(TicketMachineEventString.TICKET_REDEEMED);
  }

  // Check if can watch the show
  else if (!ticketMachineState.can(TicketMachineEventString.SHOW_JOINED)) {
    throw redirect(302, ticketUrl);
  }

  ticketService.send(TicketMachineEventString.SHOW_JOINED);

  const jitsiToken = jwt.sign(
    {
      aud: 'jitsi',
      iss: JITSI_APP_ID,
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      sub: PUBLIC_JITSI_DOMAIN,
      room: show.roomId,
      context: {
        user: {
          name: ticket.customerName,
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
      flattenObjectIds: true
    }),
    show: show.toObject({ flattenObjectIds: true })
  };
};

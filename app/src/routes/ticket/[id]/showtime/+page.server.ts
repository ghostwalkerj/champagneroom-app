import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY,
} from '$env/static/private';
import {
  PUBLIC_JITSI_DOMAIN,
  PUBLIC_PIN_PATH,
  PUBLIC_TICKET_PATH,
} from '$env/static/public';
import { TicketMachineEventString } from '$lib/machines/ticketMachine';
import type { ShowType } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import { verifyPin } from '$lib/util/pin';
import { getTicketMachineService } from '$lib/util/util.server';
import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';
import type { PageServerLoad } from './$types';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: PageServerLoad = async ({ params, cookies, locals }) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const ticketUrl = urlJoin(PUBLIC_TICKET_PATH, ticketId);
  const pinUrl = urlJoin(ticketUrl, PUBLIC_PIN_PATH);

  if (!pinHash) {
    throw redirect(303, pinUrl);
  }
  if (ticketId === null) {
    throw error(404, 'Bad ticket id');
  }

  const ticket = await Ticket.findById(ticketId)
    .orFail(() => {
      throw error(404, 'Ticket not found');
    })
    .populate('show')
    .exec();

  const show = ticket.show as unknown as ShowType;

  // Check if pin is correct
  if (!verifyPin(ticketId, ticket.pin, pinHash)) {
    throw redirect(303, pinUrl);
  }

  // Check if can watch the show
  const redisConnection = locals.redisConnection as IORedis;

  const ticketService = getTicketMachineService(ticket, show, redisConnection);
  const ticketMachineState = ticketService.getSnapshot();

  if (!ticketMachineState.can(TicketMachineEventString.SHOW_JOINED)) {
    throw redirect(303, ticketUrl);
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
          lobby_bypass: false,
        },
      },
    },
    JITSI_JWT_SECRET
  );

  return {
    jitsiToken,
    ticket: JSON.parse(JSON.stringify(ticket)),
    show: JSON.parse(JSON.stringify(show)),
  };
};

export const actions: Actions = {
  leave_show: async ({ params, cookies, locals }) => {
    console.log('leave show');
    const ticketId = params.id as string;
    const pinHash = cookies.get('pin');

    if (ticketId === null) {
      throw error(404, 'Bad ticket id');
    }

    const ticket = await Ticket.findById(ticketId)
      .orFail(() => {
        throw error(404, 'Ticket not found');
      })
      .populate('show')
      .exec();

    const show = ticket.show as unknown as ShowType;
    if (pinHash && verifyPin(ticketId, ticket.pin, pinHash)) {
      const redisConnection = locals.redisConnection as IORedis;
      const ticketService = getTicketMachineService(
        ticket,
        show,
        redisConnection
      );
      ticketService.send(TicketMachineEventString.SHOW_LEFT);
    }
    return { success: true };
  },
};

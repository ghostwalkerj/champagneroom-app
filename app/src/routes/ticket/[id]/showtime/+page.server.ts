import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY,
  MONGO_DB_ENDPOINT,
} from '$env/static/private';
import {
  PUBLIC_JITSI_DOMAIN,
  PUBLIC_PIN_PATH,
  PUBLIC_TICKET_PATH,
} from '$env/static/public';
import type { ShowType } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import urlJoin from 'url-join';
import type { PageServerLoad } from '../$types';
import { verifyPin } from '../../../../util/pin';
import { getTicketMachineService } from '../../../../util/serverUtils';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: PageServerLoad = async ({ params, cookies }) => {
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

  mongoose.connect(MONGO_DB_ENDPOINT);

  const ticket = await Ticket.findById(ticketId)
    .orFail(() => {
      throw error(404, 'Ticket not found');
    })
    .populate('show')
    .exec();

  const show = ticket.show as unknown as ShowType;

  // Check if pin is correct
  if (
    !ticket.ticketState.reservation ||
    !verifyPin(ticketId, ticket.ticketState.reservation?.pin, pinHash)
  ) {
    throw redirect(303, pinUrl);
  }

  // Check if can watch the show
  const ticketService = getTicketMachineService(ticket, show);
  const ticketMachineState = ticketService.getSnapshot();

  if (!ticketMachineState.can('JOINED SHOW')) {
    throw redirect(303, ticketUrl);
  }

  ticketService.send('JOINED SHOW');

  const jitsiToken = jwt.sign(
    {
      aud: 'jitsi',
      iss: JITSI_APP_ID,
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      sub: PUBLIC_JITSI_DOMAIN,
      room: show.roomId,
      context: {
        user: {
          name: ticket.ticketState.reservation?.name,
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
  leave_show: async ({ params, cookies }) => {
    console.log('leave show');
    const ticketId = params.id as string;
    const pinHash = cookies.get('pin');

    if (ticketId === null) {
      throw error(404, 'Bad ticket id');
    }

    mongoose.connect(MONGO_DB_ENDPOINT);

    const ticket = await Ticket.findById(ticketId)
      .orFail(() => {
        throw error(404, 'Ticket not found');
      })
      .populate('show')
      .exec();

    const show = ticket.show as unknown as ShowType;
    if (
      pinHash &&
      ticket.ticketState.reservation &&
      verifyPin(ticketId, ticket.ticketState.reservation?.pin, pinHash)
    ) {
      const ticketService = getTicketMachineService(ticket, show);
      ticketService.send('LEFT SHOW');
    }
    return { success: true };
  },
};

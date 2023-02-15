import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  JWT_TICKET_DB_SECRET,
  JWT_TICKET_DB_USER,
  PRIVATE_MASTER_DB_ENDPOINT,
} from '$env/static/private';
import {
  PUBLIC_JITSI_DOMAIN,
  PUBLIC_PIN_PATH,
  PUBLIC_TICKET_PATH,
} from '$env/static/public';
import { ticketDB } from '$lib/ORM/dbs/ticketDB';
import { ShowEventType } from '$lib/ORM/models/showEvent';
import type { TicketDocType, TicketDocument } from '$lib/ORM/models/ticket';
import { StorageType } from '$lib/ORM/rxdb';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import { verifyPin } from '$lib/util/pin';
import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

const getTicket = async (ticketId: string) => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_TICKET_DB_USER,
      kid: JWT_TICKET_DB_USER,
    },
    JWT_TICKET_DB_SECRET,
    { keyid: JWT_TICKET_DB_USER }
  );

  const masterToken = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_MASTER_DB_USER,
    },
    JWT_MASTER_DB_SECRET,
    { keyid: JWT_MASTER_DB_USER }
  );

  const db = await ticketDB(ticketId, masterToken, {
    endPoint: PRIVATE_MASTER_DB_ENDPOINT,
    storageType: StorageType.NODE_WEBSQL,
  });
  if (!db) {
    throw error(500, 'no db');
  }

  const ticket = (await db.tickets.findOne(ticketId).exec()) as TicketDocument;

  if (!ticket) {
    throw error(404, 'Ticket not found');
  }

  const show = await ticket.show_;
  if (!show) {
    throw error(404, 'Show not found');
  }

  return { token, ticket, show };
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: import('./$types').PageServerLoad = async ({
  params,
  cookies,
}) => {
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

  const { ticket: _ticket, show: _show } = await getTicket(ticketId);

  if (!verifyPin(ticketId, _ticket.ticketState.reservation.pin, pinHash)) {
    throw redirect(303, pinUrl);
  }

  // Check if can watch the show
  const ticketService = createTicketMachineService({
    ticketDocument: _ticket,
    showDocument: _show,
    saveState: true,
    observeState: false,
  });
  const ticketMachineState = ticketService.getSnapshot();

  if (!ticketMachineState.can('WATCH SHOW')) {
    throw redirect(303, ticketUrl);
  }

  ticketService.send('WATCH SHOW');
  _show.createShowevent({
    type: ShowEventType.JOINED,
    ticket: _ticket,
  });

  const ticket = _ticket.toJSON() as TicketDocType;
  const show = _show.toJSON();

  const jitsiToken = jwt.sign(
    {
      aud: 'jitsi',
      iss: JITSI_APP_ID,
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      sub: PUBLIC_JITSI_DOMAIN,
      room: _show.roomId,
      context: {
        user: {
          name: _ticket.ticketState.reservation.name,
          affiliation: 'member',
          lobby_bypass: false,
        },
      },
    },
    JITSI_JWT_SECRET
  );

  return {
    jitsiToken,
    ticket,
    show,
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
    const { ticket, show } = await getTicket(ticketId);

    if (
      pinHash &&
      verifyPin(ticketId, ticket.ticketState.reservation.pin, pinHash)
    ) {
      // Check if can watch the show
      const ticketService = createTicketMachineService({
        ticketDocument: ticket,
        showDocument: show,
        saveState: true,
        observeState: false,
      });

      ticketService.send('LEAVE SHOW');

      show.createShowevent({
        type: ShowEventType.LEFT,
        ticket,
      });
    }
    return { success: true };
  },
};

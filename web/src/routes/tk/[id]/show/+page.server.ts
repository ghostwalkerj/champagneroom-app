import {
  JWT_EXPIRY,
  JWT_TICKET_DB_SECRET,
  JWT_TICKET_DB_USER,
} from '$env/static/private';
import { PUBLIC_PIN_PATH, PUBLIC_TICKET_PATH } from '$env/static/public';
import { masterDB } from '$lib/ORM/dbs/masterDB';
import type { TicketDocType, TicketDocument } from '$lib/ORM/models/ticket';
import { verifyPin } from '$lib/util/pin';
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

  const db = await masterDB();
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
  url,
}) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const redirectUrl = urlJoin(
    url.hostname,
    PUBLIC_TICKET_PATH,
    ticketId,
    PUBLIC_PIN_PATH
  );

  if (!pinHash) {
    throw redirect(303, redirectUrl);
  }
  if (ticketId === null) {
    throw error(404, 'Bad ticket id');
  }

  const { token, ticket: _ticket, show: _show } = await getTicket(ticketId);

  if (!verifyPin(ticketId, _ticket.ticketState.reservation.pin, pinHash)) {
    throw redirect(303, redirectUrl);
  }

  const ticket = _ticket.toJSON() as TicketDocType;
  const show = _show.toJSON();

  return {
    token,
    ticket,
    show,
  };
};

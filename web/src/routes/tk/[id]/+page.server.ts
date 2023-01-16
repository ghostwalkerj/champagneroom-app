import { JWT_API_SECRET, JWT_API_USER, JWT_EXPIRY } from '$env/static/private';
import { PUBLIC_PIN_PATH } from '$env/static/public';
import { apiTicketDB } from '$lib/ORM/dbs/apiTicketDB';
import type { TicketDocType, TicketDocument } from '$lib/ORM/models/ticket';
import { StorageTypes } from '$lib/ORM/rxdb';
import { verifyPin } from '$lib/util/pin';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

const getTicket = async (ticketId: string) => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_API_USER,
      kid: JWT_API_USER,
    },
    JWT_API_SECRET
  );

  const db = await apiTicketDB(token, ticketId, StorageTypes.NODE_WEBSQL);
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

export const load: import('./$types').PageServerLoad = async ({
  params,
  cookies,
  url,
}) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const redirectUrl = urlJoin(url.href, PUBLIC_PIN_PATH);

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

export const actions: import('./$types').Actions = {
  buy_ticket: async ({ params, cookies, request, url }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'Key not found');
    }

    const { ticket } = await getTicket(ticketId);

    // Create transaction to buy ticket
  },
};

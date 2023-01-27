import { PUBLIC_TICKET_PATH } from '$env/static/public';
import {
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  PRIVATE_MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { createPinHash, verifyPin } from '$lib/util/pin';
import { error, fail, redirect } from '@sveltejs/kit';
import urlJoin from 'url-join';
import jwt from 'jsonwebtoken';
import { ticketDB } from '$lib/ORM/dbs/ticketDB';
import { StorageType } from '$lib/ORM/rxdb';
import type { TicketDocument } from '$lib/ORM/models/ticket';

const getTicket = async (ticketId: string) => {
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

  return { ticket };
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: import('./$types').PageServerLoad = async ({
  params,
  cookies,
}) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const redirectUrl = urlJoin(PUBLIC_TICKET_PATH, ticketId);

  if (ticketId === null) {
    throw error(404, 'Bad ticket id');
  }

  const { ticket } = await getTicket(ticketId);

  if (
    pinHash &&
    verifyPin(ticketId, ticket.ticketState.reservation.pin, pinHash)
  ) {
    throw redirect(303, redirectUrl);
  }
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const actions: import('./$types').Actions = {
  set_pin: async ({ params, cookies, request, url }) => {
    const ticketId = params.id;

    const data = await request.formData();
    const pin = data.get('pin') as string;

    if (!pin) {
      return fail(400, { pin, missingPin: true });
    }

    const isNum = /^\d+$/.test(pin);
    if (!isNum) {
      return fail(400, { pin, invalidPin: true });
    }

    const hash = createPinHash(ticketId, pin);
    cookies.set('pin', hash, { path: '/' });
    const redirectUrl = urlJoin(url.origin, PUBLIC_TICKET_PATH, ticketId);
    throw redirect(303, redirectUrl);
  },
};
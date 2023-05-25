import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { PUBLIC_TICKET_PATH } from '$env/static/public';
import { Ticket } from '$lib/models/ticket';
import { createPinHash, verifyPin } from '$lib/util/pin';
import { error, fail, redirect } from '@sveltejs/kit';
import mongoose from 'mongoose';
import urlJoin from 'url-join';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const redirectUrl = urlJoin(PUBLIC_TICKET_PATH, ticketId);
  await mongoose.connect(MONGO_DB_ENDPOINT);

  if (ticketId === null) {
    throw error(404, 'Bad ticket id');
  }

  const ticket = await Ticket.findById(ticketId).exec();

  if (!ticket || ticket.ticketState.reservation === undefined) {
    throw error(404, 'Ticket not found');
  }

  if (
    pinHash &&
    verifyPin(ticketId, ticket.ticketState.reservation.pin, pinHash)
  ) {
    throw redirect(303, redirectUrl);
  }
};

export const actions: Actions = {
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

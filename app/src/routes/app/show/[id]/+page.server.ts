import { error, fail, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import {
  BITCART_API_URL,
  BITCART_EMAIL,
  BITCART_INVOICE_NOTIFICATION_PATH,
  BITCART_PASSWORD,
  BITCART_STORE_ID
} from '$env/static/private';
import {
  PUBLIC_AUTH_PATH,
  PUBLIC_PAYMENT_PERIOD,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

import { Show } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import { AuthType, User, UserRole } from '$lib/models/user';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { EntityType } from '$lib/constants';
import { mensNames } from '$lib/mensNames';
import { createAuthToken } from '$lib/payment';
import { createPinHash } from '$lib/pin';
import { encrypt4Cookie } from '$lib/server/auth';
import { getShowMachineServiceFromId } from '$lib/server/machinesUtil';

import { createInvoiceInvoicesPost } from '$ext/bitcart';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  reserve_ticket: async ({ params, cookies, request, url, locals }) => {
    const showId = params.id;
    if (showId === null) {
      return fail(404, { showId, missingShowId: true });
    }
    const data = await request.formData();
    const name = data.get('name') as string;
    const pin = data.get('pin') as string;

    if (!name) {
      return fail(400, { name, missingName: true });
    }

    if (!pin) {
      return fail(400, { pin, missingPin: true });
    }

    const isNumber = /^\d+$/.test(pin);
    if (!isNumber) {
      return fail(400, { pin, invalidPin: true });
    }

    const show = await Show.findById(showId)
      .orFail(() => {
        throw error(404, 'Show not found');
      })
      .exec();

    const redisConnection = locals.redisConnection as IORedis;
    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    const showService = await getShowMachineServiceFromId(showId);

    const user = await User.create({
      name,
      roles: [UserRole.TICKET_HOLDER],
      authType: AuthType.PIN,
      password: pin
    });

    const ticket = await Ticket.create({
      user: user._id,
      show: show._id,
      agent: show.agent,
      creator: show.creator,
      price: show.price
    });
    if (!ticket) {
      return error(501, 'Show cannot Reserve Ticket');
    }

    const showState = showService.getSnapshot();

    if (
      !showState.can({
        type: ShowMachineEventString.TICKET_RESERVED,
        ticket,
        customerName: name
      })
    ) {
      return error(501, 'Show cannot Reserve Ticket');
    }

    // Create invoice in Bitcart
    const token = await createAuthToken(
      BITCART_EMAIL,
      BITCART_PASSWORD,
      BITCART_API_URL
    );

    const invoice = await createInvoiceInvoicesPost(
      {
        price: ticket.price.amount,
        currency: ticket.price.currency,
        store_id: BITCART_STORE_ID,
        expiration: +PUBLIC_PAYMENT_PERIOD / 60 / 1000,
        order_id: ticket._id.toString(),
        notification_url: urlJoin(BITCART_INVOICE_NOTIFICATION_PATH)
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!invoice || !invoice.data) {
      return error(501, 'Invoice cannot be created');
    }

    // Update ticket with invoice
    ticket.bcInvoiceId = invoice.data.id;

    const payment = invoice.data.payments
      ? invoice.data.payments[0] // Use the first wallet
      : undefined;

    if (payment && payment['payment_address']) {
      ticket.paymentAddress = payment['payment_address'];
    }
    await ticket.save();

    showQueue.add(ShowMachineEventString.TICKET_RESERVED, {
      showId: show._id.toString(),
      ticketId: ticket._id.toString(),
      customerName: name
    });

    const ticketId = encrypt4Cookie(ticket._id.toString());
    const encryptedPin = encrypt4Cookie(pin);
    if (!ticketId || !encryptedPin) {
      return error(501, 'Show cannot Reserve Ticket');
    }
    cookies.set('pin', encryptedPin, { path: PUBLIC_AUTH_PATH });
    cookies.set('ticketId', ticketId, { path: PUBLIC_AUTH_PATH });
    const redirectUrl = urlJoin(
      url.origin,
      PUBLIC_TICKET_PATH,
      ticket._id.toString()
    );
    throw redirect(302, redirectUrl);
  }
};

export const load: PageServerLoad = async ({ params }) => {
  const showId = params.id;
  if (showId === null) {
    throw error(404, 'Champagne Show not found');
  }

  const show = await Show.findById(showId)
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();

  const displayName = uniqueNamesGenerator({
    dictionaries: [mensNames]
  });

  return {
    show: show.toObject({ flattenObjectIds: true, flattenMaps: true }),
    displayName
  };
};

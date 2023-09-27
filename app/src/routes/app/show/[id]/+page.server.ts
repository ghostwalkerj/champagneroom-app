import { error, fail, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import {
    BITCART_EMAIL,
    BITCART_PASSWORD,
    BITCART_STORE_ID
} from '$env/static/private';
import {
    PUBLIC_BITCART_NOTIFICATION_PATH,
    PUBLIC_BITCART_URL,
    PUBLIC_PAYMENT_PERIOD,
    PUBLIC_TICKET_PATH
} from '$env/static/public';

import { Show } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { createInvoiceInvoicesPost } from '$lib/bitcart';
import { EntityType } from '$lib/constants';
import { mensNames } from '$lib/util/mensNames';
import { createAuthToken } from '$lib/util/payment';
import { createPinHash } from '$lib/util/pin';
import { getShowMachineServiceFromId } from '$lib/util/util.server';

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

    const ticket = await Ticket.create({
      show: show._id,
      agent: show.agent,
      creator: show.creator,
      price: show.price,
      customerName: name,
      pin
    });
    if (!ticket) {
      return error(501, 'Show cannot Reserve Ticket');
    }

    const showState = showService.getSnapshot();

    if (
      !showState.can({
        type: ShowMachineEventString.TICKET_RESERVED,
        ticketId: ticket._id.toString(),
        customerName: name
      })
    ) {
      return error(501, 'Show cannot Reserve Ticket'); // TODO: This should be atomic
    }

    // Create invoice in Bitcart
    const token = await createAuthToken(
      BITCART_EMAIL,
      BITCART_PASSWORD,
      PUBLIC_BITCART_URL
    );

    const invoice = await createInvoiceInvoicesPost(
      {
        price: ticket.price,
        store_id: BITCART_STORE_ID,
        expiration: +PUBLIC_PAYMENT_PERIOD / 60 / 1000,
        order_id: ticket._id.toString(),
        notification_url: urlJoin(PUBLIC_BITCART_NOTIFICATION_PATH)
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
    ticket.invoiceId = invoice.data.id;

    const payment = invoice.data.payments
      ? invoice.data.payments[0]
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

    const hash = createPinHash(ticket._id.toString(), pin);
    cookies.set('pin', hash, { path: '/' });
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
    show: show.toObject({ flattenObjectIds: true }),
    displayName
  };
};

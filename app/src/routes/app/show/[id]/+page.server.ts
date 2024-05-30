import { error, fail, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { zod } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import { env } from '$env/dynamic/private';

import { reserveTicketSchema } from '$lib/models/common';
import { Show } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';
import { User } from '$lib/models/user';

import type { ShowQueueType } from '$lib/workers/showWorker';

import config from '$lib/config';
import { AuthType, CurrencyType, EntityType, UserRole } from '$lib/constants';
import { authEncrypt } from '$lib/crypt';
import type { DisplayInvoice } from '$lib/ext/bitcart/models';
import { mensNames } from '$lib/mensNames';
import {
  createBitcartToken,
  InvoiceJobType,
  InvoiceStatus,
  type PaymentType
} from '$lib/payout';
import { createAuthToken, setAuthToken } from '$lib/server/auth';
import {
  getShowMachineServiceFromId,
  getTicketMachineService
} from '$lib/server/machinesUtil';

import {
  createInvoiceInvoicesPost,
  modifyInvoiceInvoicesModelIdPatch
} from '$ext/bitcart';

import type { Actions, PageServerLoad } from './$types';

const tokenName = env.AUTH_TOKEN_NAME || 'token';

export const actions: Actions = {
  reserve_ticket: async ({ params, cookies, request, locals }) => {
    const showId = params.id;
    if (showId === null) {
      return fail(404, { showId, missingShowId: true });
    }

    const form = await superValidate(request, zod(reserveTicketSchema));

    // Convenient validation check:
    if (!form.valid) {
      return fail(400, { form });
    }

    const name = form.data.name as string;
    const pin = form.data.pin as number[];
    const profileImage = form.data.profileImage as string;

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
      password: pin.join(''),
      profileImageUrl: profileImage
    });

    const ticket = (await Ticket.create({
      user: user._id,
      show: show._id,
      agent: show.agent,
      creator: show.creator,
      price: show.price
    })) as TicketDocument;
    if (!ticket) {
      console.error('Ticket cannot be created');
      return message(form, 'Show cannot reserve ticket', { status: 501 });
    }

    const showState = showService.getSnapshot();

    if (
      !showState.can({
        type: 'TICKET RESERVED',
        ticket
      })
    ) {
      console.error('Show cannot Reserve Ticket');
      return message(form, 'Show cannot reserve ticket', { status: 501 });
    }

    // Create invoice in Bitcart
    const token = await createBitcartToken(
      env.BITCART_EMAIL ?? '',
      env.BITCART_PASSWORD ?? '',
      env.BITCART_API_URL ?? '' // Add default value for env.BITCART_API_URL
    );

    let response = await createInvoiceInvoicesPost(
      {
        price: ticket.price.amount,
        currency: ticket.price.currency,
        store_id: env.BITCART_STORE_ID ?? '',
        expiration: config.TIMER.paymentPeriod / 60 / 1000,
        order_id: ticket._id.toString()
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response || !response.data) {
      console.error('Invoice cannot be created');
      return message(form, 'Invoice cannot be created', { status: 501 });
    }

    // Update the notification url
    const invoice = response.data as DisplayInvoice;
    const encryptedInvoiceId =
      authEncrypt(
        invoice.id ? (invoice.id as string) : '',
        env.AUTH_SALT ?? ''
      ) ?? '';

    const notificationUrl = env.BITCART_NOTIFICATION_URL ?? ''; // Add default value for env.BITCART_NOTIFICATION_URL
    const invoiceNotificationPath = env.BITCART_INVOICE_NOTIFICATION_PATH ?? ''; // Add default value for env.BITCART_INVOICE_NOTIFICATION_PATH

    invoice.notification_url = urlJoin(
      notificationUrl || '',
      invoiceNotificationPath,
      encryptedInvoiceId
    );

    response = await modifyInvoiceInvoicesModelIdPatch(invoice.id!, invoice, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Update ticket with invoice
    ticket.bcInvoiceId = invoice.id;

    const payment = invoice.payments
      ? (invoice.payments[0] as PaymentType) // Use the first wallet
      : undefined;

    if (payment && 'payment_address' in payment) {
      ticket.paymentAddress = payment['payment_address'] as string;
    }
    await ticket.save();

    showQueue.add('TICKET RESERVED', {
      showId: show._id.toString(),
      ticketId: ticket._id.toString(),
      customerName: name
    });

    // If the ticket is free, skip the payment
    if (ticket.price.amount === 0 && ticket.bcInvoiceId) {
      const ticketService = getTicketMachineService(ticket, redisConnection);
      ticketService.send({
        type: 'PAYMENT INITIATED',
        paymentCurrency: CurrencyType.NONE
      });

      ticketService?.stop();

      const token = await createBitcartToken(
        env.BITCART_EMAIL ?? '', // Add default value for env.BITCART_EMAIL
        env.BITCART_PASSWORD ?? '', // Add default value for env.BITCART_PASSWORD
        env.BITCART_API_URL ?? '' // Add default value for env.BITCART_API_URL
      );

      // Alert the invoice is complete
      try {
        await modifyInvoiceInvoicesModelIdPatch(
          ticket.bcInvoiceId,
          {
            status: InvoiceStatus.COMPLETE
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error_) {
        console.error(error_);
      }

      const invoiceQueue = new Queue(EntityType.INVOICE, {
        connection: redisConnection
      });
      invoiceQueue.add(InvoiceJobType.UPDATE, {
        bcInvoiceId: ticket.bcInvoiceId,
        status: InvoiceStatus.COMPLETE
      });

      invoiceQueue.close();
    }

    const redirectUrl = urlJoin(config.PATH.ticket, ticket._id.toString());

    const encAuthToken = createAuthToken({
      id: user._id.toString(),
      selector: '_id',
      authType: AuthType.PIN
    });

    encAuthToken && setAuthToken(cookies, tokenName, encAuthToken);

    showQueue.close();
    showService.stop();

    throw redirect(302, redirectUrl);
  }
};

export const load: PageServerLoad = async (event) => {
  const showId = event.params.id;
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

  const form = await superValidate(
    {
      name: displayName,
      pin: Array.from({ length: 8 }, () => Math.floor(Math.random() * 10))
    },
    zod(reserveTicketSchema),
    {
      errors: false
    }
  );

  return {
    show: show.toObject({ flattenObjectIds: true, flattenMaps: true }),
    displayName,
    form
  };
};

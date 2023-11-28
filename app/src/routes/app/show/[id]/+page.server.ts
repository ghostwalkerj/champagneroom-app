import { error, fail, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import {
  AUTH_MAX_AGE,
  AUTH_SALT,
  AUTH_TOKEN_NAME,
  BITCART_API_URL,
  BITCART_EMAIL,
  BITCART_INVOICE_NOTIFICATION_PATH,
  BITCART_NOTIFICATION_URL,
  BITCART_PASSWORD,
  BITCART_STORE_ID,
  JWT_EXPIRY,
  JWT_PRIVATE_KEY
} from '$env/static/private';

import { Show } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import { User, UserRole } from '$lib/models/user';

import { ShowMachineEventString } from '$lib/machines/showMachine';
import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import Config from '$lib/config';
import { AuthType, EntityType } from '$lib/constants';
import { authEncrypt } from '$lib/crypt';
import { mensNames } from '$lib/mensNames';
import { createAuthToken, InvoiceJobType, InvoiceStatus } from '$lib/payment';
import {
  getShowMachineServiceFromId,
  getTicketMachineService
} from '$lib/server/machinesUtil';

import {
  createInvoiceInvoicesPost,
  modifyInvoiceInvoicesModelIdPatch
} from '$ext/bitcart';

import type { Actions, PageServerLoad } from './$types';

const tokenName = AUTH_TOKEN_NAME || 'token';

export const actions: Actions = {
  reserve_ticket: async ({ params, cookies, request, locals }) => {
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
      console.error('Ticket cannot be created');
      throw error(501, 'Show cannot Reserve Ticket');
    }

    const showState = showService.getSnapshot();

    if (
      !showState.can({
        type: ShowMachineEventString.TICKET_RESERVED,
        ticket,
        customerName: name
      })
    ) {
      console.error('Show cannot Reserve Ticket');
      throw error(501, 'Show cannot Reserve Ticket');
    }

    // Create invoice in Bitcart
    const token = await createAuthToken(
      BITCART_EMAIL,
      BITCART_PASSWORD,
      BITCART_API_URL
    );

    let response = await createInvoiceInvoicesPost(
      {
        price: ticket.price.amount,
        currency: ticket.price.currency,
        store_id: BITCART_STORE_ID,
        expiration: Config.TIMER.paymentPeriod / 60 / 1000,
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
      throw error(501, 'Invoice cannot be created');
    }

    // Update the notification url
    const invoice = response.data;
    const encryptedInvoiceId = authEncrypt(invoice.id, AUTH_SALT) ?? '';

    invoice.notification_url = urlJoin(
      BITCART_NOTIFICATION_URL,
      BITCART_INVOICE_NOTIFICATION_PATH,
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
      ? invoice.payments[0] // Use the first wallet
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

    // If the ticket is free, skip the payment
    if (ticket.price.amount === 0 && ticket.bcInvoiceId) {
      const ticketService = getTicketMachineService(ticket, redisConnection);
      ticketService.send({
        type: TicketMachineEventString.PAYMENT_INITIATED
      });

      ticketService?.stop();

      const token = await createAuthToken(
        BITCART_EMAIL,
        BITCART_PASSWORD,
        BITCART_API_URL
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

    const redirectUrl = urlJoin(Config.Path.ticket, ticket._id.toString());

    const authToken = jwt.sign(
      {
        selector: '_id',
        password: pin,
        _id: user._id.toString(),
        exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
        authType: AuthType.PIN
      },
      JWT_PRIVATE_KEY
    );

    const encAuthToken = authEncrypt(authToken, AUTH_SALT);

    encAuthToken &&
      cookies.set(tokenName, encAuthToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: +AUTH_MAX_AGE,
        expires: new Date(Date.now() + +AUTH_MAX_AGE)
      });

    showQueue.close();
    showService.stop();

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

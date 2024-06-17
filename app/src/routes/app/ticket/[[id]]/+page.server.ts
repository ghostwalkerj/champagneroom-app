import { error, fail } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';

import { env } from '$env/dynamic/private';
import { env as pubEnvironment } from '$env/dynamic/public';

import {
  refundSchema,
  ticketDisputeSchema,
  ticketFeedbackSchema
} from '$lib/models/common';
import type { ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';

import {
  createTicketMachineService,
  type TicketMachineEventType,
  type TicketMachineSnapshotType
} from '$lib/machines/ticketMachine';

import {
  ActorType,
  type CurrencyType,
  DisputeReason,
  RefundReason,
  ShowStatus
} from '$lib/constants';
import { createBitcartToken, InvoiceStatus } from '$lib/payments';

import { getInvoiceByIdInvoicesModelIdGet } from '$ext/bitcart';
import type { DisplayInvoice } from '$ext/bitcart/models';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  cancel_ticket: async ({ locals }) => {
    const ticket = locals.ticket as TicketDocument;
    const show = locals.show as ShowDocument;
    const redisConnection = locals.redisConnection as IORedis;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });

    const cancelEvent = {
      type: 'CANCELLATION REQUESTED'
    } as TicketMachineEventType;

    ticketService.send(cancelEvent);
    ticketService?.stop();
    return {
      success: true,
      ticketCancelled: true
    };
  },

  leave_feedback: async ({ request, locals }) => {
    const ticket = locals.ticket as TicketDocument;
    const show = locals.show as ShowDocument;
    const redisConnection = locals.redisConnection as IORedis;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });
    const data = await request.formData();
    const rating = data.get('rating') as string;
    const review = data.get('review') as string;
    if (!rating || rating === '0') {
      return fail(400, { rating, missingRating: true });
    }
    const feedback = ticketFeedbackSchema.parse({
      rating: +rating,
      review
    });
    ticketService.send({
      type: 'FEEDBACK RECEIVED',
      feedback
    });

    ticketService?.stop();
    return { success: true, rating, review, feedbackReceived: true };
  },

  initiate_dispute: async ({ request, locals }) => {
    const ticket = locals.ticket as TicketDocument;
    const show = locals.show as ShowDocument;
    const redisConnection = locals.redisConnection as IORedis;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });
    const data = await request.formData();
    const reason = data.get('reason') as string;
    const explanation = data.get('explanation') as string;

    if (!explanation || explanation === '') {
      return fail(400, { explanation, missingExplanation: true });
    }
    if (!reason) {
      return fail(400, { reason, missingReason: true });
    }
    const dispute = ticketDisputeSchema.parse({
      disputedBy: ActorType.CUSTOMER,
      reason: reason as DisputeReason,
      explanation
    });
    const refund = refundSchema.parse({
      requestedAmount: ticket.ticketState.sale?.total || 0,
      reason: RefundReason.DISPUTE_DECISION
    });
    ticketService.send({
      type: 'DISPUTE INITIATED',
      dispute,
      refund
    });
    ticketService?.stop();
    return { success: true, reason, explanation, disputeInitiated: true };
  },

  initiate_payment: async ({ request, locals }) => {
    const ticket = locals.ticket as TicketDocument;
    const show = locals.show as ShowDocument;
    const redisConnection = locals.redisConnection as IORedis;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });
    const data = await request.formData();
    const paymentAddress = data.get('paymentAddress') as string;
    const paymentId = data.get('paymentId') as string;
    const paymentCurrency = data.get('paymentCurrency') as string;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    if (!ticket.bcInvoiceId) {
      throw error(404, 'Invoice not found');
    }

    if (!paymentAddress) {
      return fail(400, { paymentAddress, missingAddress: true });
    }

    if (!paymentId) {
      return fail(400, { paymentId, missingPaymentId: true });
    }

    // Alert Ticket to incoming transaction
    ticketService.send({
      type: 'PAYMENT INITIATED',
      paymentCurrency: paymentCurrency.toUpperCase() as CurrencyType,
      paymentId,
      paymentAddress
    });
    ticketService?.stop();

    return { success: true, paymentInitiated: true };
  },

  join_show: async ({ locals }) => {
    const ticket = locals.ticket as TicketDocument;
    const show = locals.show as ShowDocument;
    const redisConnection = locals.redisConnection as IORedis;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });

    ticketService.send({
      type: 'SHOW JOINED'
    });
    ticketService?.stop();
    return { success: true };
  },

  leave_show: async ({ locals }) => {
    const ticket = locals.ticket as TicketDocument;
    const show = locals.show as ShowDocument;
    const redisConnection = locals.redisConnection as IORedis;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });
    ticketService.send({
      type: 'SHOW LEFT'
    });
    ticketService?.stop();
    return { success: true };
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const ticket = locals.ticket;
  const user = locals.user;

  if (!user) {
    throw error(401, 'Unauthorized');
  }

  if (!ticket) {
    throw error(404, 'Ticket not found');
  }
  const show = locals.show;
  if (!show) {
    throw error(404, 'Show not found');
  }

  let invoice: DisplayInvoice | undefined;

  if (ticket.bcInvoiceId) {
    // Get invoice associated with ticket
    const token = await createBitcartToken(
      env.BITCART_EMAIL ?? '',
      env.BITCART_PASSWORD ?? '',
      env.BITCART_API_URL ?? ''
    );

    const response =
      (ticket.bcInvoiceId &&
        ((await getInvoiceByIdInvoicesModelIdGet(ticket.bcInvoiceId, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })) as AxiosResponse<DisplayInvoice>)) ||
      undefined;

    if (!response) {
      throw error(404, 'Invoice not found');
    }

    invoice = response.data;
  }

  const jitsiToken = jwt.sign(
    {
      aud: 'jitsi',
      iss: env.JITSI_APP_ID,
      exp: Math.floor(Date.now() / 1000) + +(env.JWT_EXPIRY ?? 0),
      sub: pubEnvironment.PUBLIC_JITSI_DOMAIN,
      room: show.conferenceKey,
      context: {
        user: {
          name: user.name,
          affiliation: 'member',
          lobby_bypass: false
        }
      }
    },
    env.JITSI_JWT_SECRET || '' // Ensure env.JITSI_JWT_SECRET is not undefined
  );

  const disputeForm = await superValidate(
    { ...ticket.ticketState.dispute, ticketId: ticket.id },
    zod(ticketDisputeSchema),
    { errors: false }
  );

  const feedbackForm = await superValidate(
    { ...ticket.ticketState.feedback, ticketId: ticket.id },
    zod(ticketFeedbackSchema),
    { errors: false }
  );

  const tsm = createTicketMachineService({
    ticket,
    show,
    redisConnection: locals.redisConnection
  });
  const ts = tsm.getSnapshot() as TicketMachineSnapshotType;
  const ticketPermissions = {
    stateValue: ts.value,
    shouldPay: ts.matches({ reserved: 'waiting4Payment' }),
    canWatchShow:
      ts.matches({ reserved: 'waiting4Show' }) || ts.matches('redeemed'),
    hasPaymentSent:
      invoice !== undefined &&
      ts.matches({ reserved: 'initiatedPayment' }) &&
      invoice.status !== InvoiceStatus.COMPLETE,
    canCancelTicket:
      (ts.matches({ reserved: 'waiting4Show' }) ||
        ts.matches({ reserved: 'waiting4Payment' })) &&
      show.showState.status !== ShowStatus.LIVE,
    canLeaveFeedback: ts.can({
      type: 'FEEDBACK RECEIVED',
      feedback: {
        createdAt: new Date(),
        rating: 5
      }
    }),
    canDispute: ts.can({
      type: 'DISPUTE INITIATED',
      dispute: ticketDisputeSchema.parse({
        disputedBy: ActorType.CUSTOMER,
        reason: DisputeReason.ENDED_EARLY
      }),
      refund: refundSchema.parse({
        reason: RefundReason.DISPUTE_DECISION
      })
    }),
    isWaitingForShow: ts.can({ type: 'SHOW JOINED' }),
    isTicketDone: ts.status === 'done',
    hasShowStarted: show.showState.status === ShowStatus.LIVE
  };
  tsm.stop();

  return {
    jitsiToken,
    disputeForm,
    feedbackForm,
    ticket: ticket.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    user: user?.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    show: show.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    invoice,
    ticketPermissions
  };
};

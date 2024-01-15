import { error, fail } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';

import {
  BITCART_API_URL,
  BITCART_EMAIL,
  BITCART_PASSWORD,
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY
} from '$env/static/private';
import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

import {
  cancelZodSchema,
  disputeZodSchema,
  refundZodSchema,
  ticketFeedbackZodSchema
} from '$lib/models/common';

import type { TicketMachineEventType } from '$lib/machines/ticketMachine';

import type { PayoutQueueType } from '$lib/workers/payoutWorker';

import type { CurrencyType, DisputeReason } from '$lib/constants';
import {
  ActorType,
  CancelReason,
  EntityType,
  RefundReason,
  TicketMachineEventString
} from '$lib/constants';
import {
  InvoiceJobType,
  PayoutJobType,
  createBitcartToken
} from '$lib/payment';
import { getTicketMachineService } from '$lib/server/machinesUtil';

import {
  getInvoiceByIdInvoicesModelIdGet,
  updatePaymentDetailsInvoicesModelIdDetailsPatch
} from '$ext/bitcart';
import type { DisplayInvoice } from '$ext/bitcart/models';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  cancel_ticket: async ({ locals }) => {
    const ticket = locals.ticket;
    if (!ticket) {
      throw error(404, 'Ticket not found');
    }
    const redisConnection = locals.redisConnection as IORedis;

    const ticketService = getTicketMachineService(ticket, redisConnection);
    const state = ticketService.getSnapshot();
    const bcInvoiceId = state.context.ticketDocument.bcInvoiceId;

    // Cancel the invoice attached to the ticket if no payment has been made
    if (state.matches('reserved.waiting4Payment')) {
      const cancel = cancelZodSchema.parse({
        cancelledBy: ActorType.CUSTOMER,
        cancelledInState: JSON.stringify(state.value),
        reason: CancelReason.CUSTOMER_CANCELLED
      });

      const cancelEvent = {
        type: 'CANCELLATION REQUESTED',
        cancel
      } as TicketMachineEventType;

      ticketService.send(cancelEvent);

      const invoiceQueue = new Queue(EntityType.INVOICE, {
        connection: redisConnection
      });
      invoiceQueue.add(InvoiceJobType.CANCEL, {
        bcInvoiceId
      });
      invoiceQueue.close();
    }

    // If a payment as been made or in progress, then issue a refund
    else if (state.matches('reserved.waiting4Show')) {
      // Check what payments were made from sales
      const sales = ticket.ticketState.sale;
      if (!sales) {
        throw error(404, 'No sales found');
      }

      // Create refund object
      const refund = refundZodSchema.parse({
        reason: CancelReason.CUSTOMER_CANCELLED,
        requestedAmounts: sales.total,
        refundCurrency: sales.paymentCurrency
      });

      // Refund the same amount as sent, not equivalent to show currency
      // ie, show currency is USD, but payment was made in ETH
      ticketService // Send refund event
        .send({
          type: TicketMachineEventString.REFUND_REQUESTED,
          refund
        });

      const payoutQueue = new Queue(EntityType.PAYOUT, {
        connection: redisConnection
      }) as PayoutQueueType;
      payoutQueue.add(PayoutJobType.REFUND_SHOW, {
        bcInvoiceId,
        ticketId: ticket._id
      });
      payoutQueue.close();
    }

    ticketService?.stop();

    return {
      success: true,
      ticketCancelled: true
    };
  },

  leave_feedback: async ({ request, locals }) => {
    const ticket = locals.ticket;
    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const data = await request.formData();
    const rating = data.get('rating') as string;
    const review = data.get('review') as string;

    if (!rating || rating === '0') {
      return fail(400, { rating, missingRating: true });
    }

    const redisConnection = locals.redisConnection as IORedis;

    const ticketService = getTicketMachineService(ticket, redisConnection);

    const state = ticketService.getSnapshot();
    const feedback = ticketFeedbackZodSchema.parse({
      rating: +rating,
      review
    });
    if (
      state.can({ type: TicketMachineEventString.FEEDBACK_RECEIVED, feedback })
    ) {
      ticketService.send({
        type: TicketMachineEventString.FEEDBACK_RECEIVED,
        feedback
      });
    }

    ticketService?.stop();

    return { success: true, rating, review, feedbackReceived: true };
  },

  initiate_dispute: async ({ request, locals }) => {
    const ticket = locals.ticket;
    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const data = await request.formData();
    const reason = data.get('reason') as string;
    const explanation = data.get('explanation') as string;

    if (!explanation || explanation === '') {
      return fail(400, { explanation, missingExplanation: true });
    }

    if (!reason) {
      return fail(400, { reason, missingReason: true });
    }

    const redisConnection = locals.redisConnection as IORedis;
    const ticketService = getTicketMachineService(ticket, redisConnection);

    const state = ticketService.getSnapshot();
    const dispute = disputeZodSchema.parse({
      disputedBy: ActorType.CUSTOMER,
      reason: reason as DisputeReason,
      explanation
    });

    const refund = refundZodSchema.parse({
      requestedAmount: ticket.ticketState.sale?.total || 0,
      reason: RefundReason.DISPUTE_DECISION
    });

    if (
      state.can({
        type: TicketMachineEventString.DISPUTE_INITIATED,
        dispute,
        refund
      })
    ) {
      ticketService.send({
        type: TicketMachineEventString.DISPUTE_INITIATED,
        dispute,
        refund
      });
    }

    ticketService?.stop();

    return { success: true, reason, explanation, disputeInitiated: true };
  },

  initiate_payment: async ({ request, locals }) => {
    const data = await request.formData();
    const address = data.get('address') as string;
    const paymentId = data.get('paymentId') as string;
    const paymentCurrency = data.get('paymentCurrency') as string;
    const ticket = locals.ticket;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    if (!ticket.bcInvoiceId) {
      throw error(404, 'Invoice not found');
    }

    if (!address) {
      return fail(400, { address, missingAddress: true });
    }

    if (!paymentId) {
      return fail(400, { paymentId, missingPaymentId: true });
    }

    const redisConnection = locals.redisConnection as IORedis;

    // Tell bitcart payment is coming
    const token = await createBitcartToken(
      BITCART_EMAIL,
      BITCART_PASSWORD,
      BITCART_API_URL
    );

    try {
      updatePaymentDetailsInvoicesModelIdDetailsPatch(
        ticket.bcInvoiceId,
        {
          id: paymentId,
          address
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

    // Alert Ticket to incoming transaction
    const ticketService = getTicketMachineService(ticket, redisConnection);

    ticketService.send({
      type: TicketMachineEventString.PAYMENT_INITIATED,
      paymentCurrency: paymentCurrency.toUpperCase() as CurrencyType
    });

    ticketService?.stop();

    return { success: true, paymentInitiated: true };
  },

  join_show: async ({ locals }) => {
    const ticket = locals.ticket;
    if (!ticket) {
      throw error(404, 'Ticket not found');
    }

    const redisConnection = locals.redisConnection as IORedis;

    const ticketService = getTicketMachineService(ticket, redisConnection);

    const state = ticketService.getSnapshot();

    if (state.can(TicketMachineEventString.TICKET_REDEEMED)) {
      ticketService.send(TicketMachineEventString.TICKET_REDEEMED);
      ticketService.send(TicketMachineEventString.SHOW_JOINED);
    } else if (state.can(TicketMachineEventString.SHOW_JOINED)) {
      ticketService.send(TicketMachineEventString.SHOW_JOINED);
    }

    ticketService?.stop();

    return { success: true };
  },
  leave_show: async ({ locals }) => {
    const ticket = locals.ticket;

    if (!ticket) {
      throw error(404, 'Ticket not found');
    }
    const redisConnection = locals.redisConnection as IORedis;
    const ticketService = getTicketMachineService(ticket, redisConnection);
    ticketService.send(TicketMachineEventString.SHOW_LEFT);
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
  // Get invoice associated with ticket
  const token = await createBitcartToken(
    BITCART_EMAIL,
    BITCART_PASSWORD,
    BITCART_API_URL
  );

  const invoice =
    (ticket.bcInvoiceId &&
      ((await getInvoiceByIdInvoicesModelIdGet(ticket.bcInvoiceId, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })) as AxiosResponse<DisplayInvoice>)) ||
    undefined;

  if (!invoice) {
    throw error(404, 'Invoice not found');
  }

  const jitsiToken = jwt.sign(
    {
      aud: 'jitsi',
      iss: JITSI_APP_ID,
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      sub: PUBLIC_JITSI_DOMAIN,
      room: show.conferenceKey,
      context: {
        user: {
          name: user.name,
          affiliation: 'member',
          lobby_bypass: false
        }
      }
    },
    JITSI_JWT_SECRET
  );

  return {
    jitsiToken,
    ticket: ticket.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    user: user?.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    show: show.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    invoice: invoice?.data
  };
};

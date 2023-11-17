import { error, fail } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { Types } from 'mongoose';

import {
  BITCART_API_URL,
  BITCART_EMAIL,
  BITCART_PASSWORD
} from '$env/static/private';

import type {
  CancelType,
  DisputeReason,
  DisputeType,
  FeedbackType,
  RefundType
} from '$lib/models/common';
import { CancelReason, RefundReason } from '$lib/models/common';

import type { TicketMachineEventType } from '$lib/machines/ticketMachine';
import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import type { PayoutQueueType } from '$lib/workers/payoutWorker';

import { ActorType, EntityType } from '$lib/constants';
import { createAuthToken, InvoiceJobType, PayoutJobType } from '$lib/payment';
import {
  getTicketMachineService,
  getTicketMachineServiceFromId
} from '$lib/server/machinesUtil';

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
      const cancel = {
        _id: new Types.ObjectId(),
        cancelledBy: ActorType.CUSTOMER,
        cancelledInState: JSON.stringify(state.value),
        reason: CancelReason.CUSTOMER_CANCELLED,
        cancelledAt: new Date()
      } as CancelType;

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
    else if (
      state.matches('reserved.receivedPayment') ||
      state.matches('reserved.waiting4Show')
    ) {
      // Check what payments were made from sales
      const sales = ticket.ticketState.sale;
      if (!sales) {
        throw error(404, 'No sales found');
      }

      // Create refund object
      const refund = {
        _id: new Types.ObjectId(),
        requestedAt: new Date(),
        reason: CancelReason.CUSTOMER_CANCELLED,
        transactions: [],
        requestedAmounts: sales.totals,
        approvedAmounts: new Map<string, number>(),
        totals: new Map<string, number>(),
        payouts: {} as any
      } as RefundType;

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
    const feedback = {
      _id: new Types.ObjectId(),
      rating: +rating,
      review
    } as FeedbackType;

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
    const dispute = {
      _id: new Types.ObjectId(),
      disputedBy: ActorType.CUSTOMER,
      reason: reason as DisputeReason,
      explanation,
      startedAt: new Date()
    } as DisputeType;

    const refund = {
      requestedAmounts: ticket.ticketState.sale
        ? ticket.ticketState.sale.totals
        : ({} as Map<string, number>),
      approvedAmounts: {} as Map<string, number>,
      _id: new Types.ObjectId(),
      requestedAt: new Date(),
      transactions: [] as Types.ObjectId[],
      actualAmounts: {} as Map<string, number>,
      reason: RefundReason.DISPUTE_DECISION,
      totals: {} as Map<string, number>,
      payouts: {} as any
    } as RefundType;

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
    const bcInvoiceId = data.get('bcInvoiceId') as string;
    const paymentId = data.get('paymentId') as string;
    const ticketId = data.get('ticketId') as string;

    if (!address) {
      return fail(400, { address, missingAddress: true });
    }

    if (!bcInvoiceId) {
      return fail(400, { bcInvoiceId, missingInvoiceId: true });
    }

    if (!paymentId) {
      return fail(400, { paymentId, missingPaymentId: true });
    }

    const redisConnection = locals.redisConnection as IORedis;

    // Tell bitcart payment is coming
    const token = await createAuthToken(
      BITCART_EMAIL,
      BITCART_PASSWORD,
      BITCART_API_URL
    );

    try {
      updatePaymentDetailsInvoicesModelIdDetailsPatch(
        bcInvoiceId,
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
    const ticketService = await getTicketMachineServiceFromId(
      ticketId,
      redisConnection
    );

    ticketService.send({
      type: TicketMachineEventString.PAYMENT_INITIATED
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
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const ticket = locals.ticket;
  const user = locals.user;

  if (!ticket) {
    throw error(404, 'Ticket not found');
  }
  const show = locals.show;
  if (!show) {
    throw error(404, 'Show not found');
  }
  // Get invoice associated with ticket
  const token = await createAuthToken(
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

  return {
    ticket: ticket.toObject({ flattenObjectIds: true, flattenMaps: true }),
    user: user?.toObject({ flattenObjectIds: true, flattenMaps: true }),
    show: show.toObject({ flattenObjectIds: true, flattenMaps: true }),
    invoice: invoice?.data
  };
};

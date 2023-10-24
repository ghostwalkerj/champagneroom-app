import { error, fail, redirect } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import urlJoin from 'url-join';

import {
  BITCART_API_URL,
  BITCART_EMAIL,
  BITCART_PASSWORD
} from '$env/static/private';
import { PUBLIC_PIN_PATH } from '$env/static/public';

import type {
  CancelType,
  DisputeReason,
  DisputeType,
  FeedbackType,
  RefundType
} from '$lib/models/common';
import { CancelReason, RefundReason } from '$lib/models/common';
import { Show } from '$lib/models/show';
import type { TicketType } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';

import type { TicketMachineEventType } from '$lib/machines/ticketMachine';
import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import type { PayoutQueueType } from '$lib/workers/payoutWorker';

import { ActorType, EntityType } from '$lib/constants';
import {
  createAuthToken,
  InvoiceJobType,
  PayoutJobType
} from '$lib/util/payment';
import { verifyPin } from '$lib/util/pin';
import {
  getTicketMachineService,
  getTicketMachineServiceFromId
} from '$lib/util/util.server';

import {
  getInvoiceByIdInvoicesModelIdGet,
  updatePaymentDetailsInvoicesModelIdDetailsPatch
} from '$ext/bitcart';
import type { DisplayInvoice } from '$ext/bitcart/models';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  cancel_ticket: async ({ params, locals }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'Ticket not found');
    }

    const redisConnection = locals.redisConnection as IORedis;
    const ticket = (await Ticket.findById(ticketId)) as TicketType;

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
        ticketId
      });
    }

    return {
      success: true,
      ticketCancelled: true
    };
  },

  leave_feedback: async ({ params, request, locals }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'TicketId not found');
    }

    const data = await request.formData();
    const rating = data.get('rating') as string;
    const review = data.get('review') as string;

    if (!rating || rating === '0') {
      return fail(400, { rating, missingRating: true });
    }

    const redisConnection = locals.redisConnection as IORedis;

    const ticketService = await getTicketMachineServiceFromId(
      ticketId,
      redisConnection
    );

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

    return { success: true, rating, review };
  },

  initiate_dispute: async ({ params, request, locals }) => {
    const ticketId = params.id;
    if (ticketId === null) {
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
    const ticket = (await Ticket.findById(ticketId)) as TicketType;
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

    return { success: true, reason, explanation };
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

    return { success: true };
  }
};

export const load: PageServerLoad = async ({ params, cookies, url }) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const redirectUrl = urlJoin(url.href, PUBLIC_PIN_PATH);

  if (!pinHash) {
    throw redirect(302, redirectUrl);
  }
  if (ticketId === null) {
    throw error(404, 'Bad ticket id');
  }

  const ticket = await Ticket.findById(ticketId)
    .orFail(() => {
      throw error(404, 'Ticket not found');
    })
    .exec();

  if (!verifyPin(ticketId, ticket.pin, pinHash)) {
    throw redirect(302, redirectUrl);
  }

  const show = await Show.findById(ticket.show)
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();

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
    show: show.toObject({ flattenObjectIds: true, flattenMaps: true }),
    invoice: invoice?.data
  };
};

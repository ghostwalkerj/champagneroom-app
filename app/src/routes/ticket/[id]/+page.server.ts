import { PUBLIC_PIN_PATH } from '$env/static/public';
import type {
  TicketDisputeReason,
  TicketDocType,
  TicketType,
} from '$lib/models/ticket';
import { Ticket, TicketCancelReason } from '$lib/models/ticket';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';

import { MONGO_DB_ENDPOINT } from '$env/static/private';
import type { ShowType } from '$lib/models/show';
import { ActorType } from '$lib/util/constants';
import { verifyPin } from '$lib/util/pin';
import {
  getTicketMachineService,
  getTicketMachineServiceFromId,
} from '$lib/util/ssHelper';
import { error, fail, redirect } from '@sveltejs/kit';
import mongoose from 'mongoose';
import urlJoin from 'url-join';
import type { TicketMachineEventType } from '$lib/machines/ticketMachine';

const getTicketService = async (ticketId: string) => {
  const ticket = await Ticket.findById(ticketId)
    .orFail(() => {
      throw error(404, 'Ticket not found');
    })
    .populate('show')
    .exec();

  const show = ticket.show as unknown as ShowType;

  const ticketService = await getTicketMachineService(ticket, show);
  return { ticket, show, ticketService };
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: import('./$types').PageServerLoad = async ({
  params,
  cookies,
  url,
}) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const redirectUrl = urlJoin(url.href, PUBLIC_PIN_PATH);
  mongoose.connect(MONGO_DB_ENDPOINT);

  if (!pinHash) {
    throw redirect(303, redirectUrl);
  }
  if (ticketId === null) {
    throw error(404, 'Bad ticket id');
  }

  const ticket = (await Ticket.findById(ticketId)
    .orFail(() => {
      throw error(404, 'Ticket not found');
    })
    .populate('show')
    .exec()) as TicketDocType;

  if (ticket.ticketState.reservation === undefined) {
    throw error(404, 'Ticket not reserved');
  }

  if (!verifyPin(ticketId, ticket.ticketState.reservation.pin, pinHash)) {
    throw redirect(303, redirectUrl);
  }

  return {
    ticket: JSON.parse(JSON.stringify(ticket)),
    show: JSON.parse(JSON.stringify(ticket.show)),
  };
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const actions: import('./$types').Actions = {
  buy_ticket: async ({ params }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'Key not found');
    }

    mongoose.connect(MONGO_DB_ENDPOINT);

    const { ticket, show, ticketService } = await getTicketService(ticketId);

    Transaction.create({
      //TODO: add transaction data
      hash: '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e',
      from: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
      value: ticket.price.toString(),
      block: 123,
      reason: TransactionReasonType.TICKET_PAYMENT,
      ticket: ticket._id,
      show: show._id,
      agent: show.agent,
      talent: show.talent,
    }).then(transaction => {
      ticketService.send({ type: 'PAYMENT RECEIVED', transaction });
    });

    return { success: true, ticketBought: true };
  },
  cancel_ticket: async ({ params }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'Key not found');
    }
    mongoose.connect(MONGO_DB_ENDPOINT);

    const { ticket, show, ticketService } = await getTicketService(ticketId);
    const state = ticketService.getSnapshot();

    const cancel = {
      canceller: ActorType.CUSTOMER,
      cancelledInState: JSON.stringify(state.value),
      reason: TicketCancelReason.CUSTOMER_CANCELLED,
      cancelledAt: new Date(),
    };

    const cancelEvent = {
      type: 'REQUEST CANCELLATION',
      cancel,
    } as TicketMachineEventType;

    if (state.can(cancelEvent)) {
      //TODO: make real transaction

      ticketService.send(cancelEvent);

      if (ticket.ticketState.totalPaid > ticket.ticketState.totalRefunded) {
        Transaction.create({
          //TODO: add transaction data
          hash: '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e',
          from: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
          to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
          value: ticket.price.toString(),
          block: 123,
          reason: TransactionReasonType.TICKET_PAYMENT,
          ticket: ticket._id,
          show: show._id,
          agent: show.agent,
          talent: show.talent,
        }).then(transaction => {
          ticketService.send({ type: 'REFUND RECEIVED', transaction });
        });
      }
    }
    return { success: true, ticketCancelled: true };
  },
  leave_feedback: async ({ params, request }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'Key not found');
    }

    const data = await request.formData();
    const rating = data.get('rating') as string;
    const review = data.get('review') as string;

    if (!rating || rating === '0') {
      return fail(400, { rating, missingRating: true });
    }

    const ticketService = await getTicketMachineServiceFromId(ticketId);

    const state = ticketService.getSnapshot();
    const feedback = {
      rating: +rating,
      review,
    } as TicketType['ticketState']['feedback'];

    if (state.can({ type: 'FEEDBACK RECEIVED', feedback })) {
      ticketService.send({
        type: 'FEEDBACK RECEIVED',
        feedback,
      });
    }

    return { success: true, rating, review };
  },
  initiate_dispute: async ({ params, request }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'Key not found');
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

    const ticketService = await getTicketMachineServiceFromId(ticketId);

    const state = ticketService.getSnapshot();
    const dispute = {
      disputer: ActorType.CUSTOMER,
      reason: reason as TicketDisputeReason,
      explanation,
      startedAt: new Date(),
    } as TicketType['ticketState']['dispute'];

    if (state.can({ type: 'DISPUTE INITIATED', dispute })) {
      ticketService.send({
        type: 'DISPUTE INITIATED',
        dispute,
      });
    }

    return { success: true, reason, explanation };
  },
};

import {
  JWT_EXPIRY,
  JWT_TICKET_DB_SECRET,
  JWT_TICKET_DB_USER,
} from '$env/static/private';
import { PUBLIC_PIN_PATH } from '$env/static/public';
import { masterDB } from '$lib/ORM/dbs/masterDB';
import type { TicketDocType, TicketDocument } from '$lib/ORM/models/ticket';
import { TransactionReasonType } from '$lib/ORM/models/transaction';
import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import { ActorType } from '$lib/util/constants';
import { verifyPin } from '$lib/util/pin';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

const getTicket = async (ticketId: string) => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_TICKET_DB_USER,
      kid: JWT_TICKET_DB_USER,
    },
    JWT_TICKET_DB_SECRET,
    { keyid: JWT_TICKET_DB_USER }
  );

  const db = await masterDB();
  if (!db) {
    throw error(500, 'no db');
  }

  const ticket = (await db.tickets.findOne(ticketId).exec()) as TicketDocument;

  if (!ticket) {
    throw error(404, 'Ticket not found');
  }

  const show = await ticket.show_;
  if (!show) {
    throw error(404, 'Show not found');
  }

  return { token, ticket, show };
};

export const load: import('./$types').PageServerLoad = async ({
  params,
  cookies,
  url,
}) => {
  const ticketId = params.id;
  const pinHash = cookies.get('pin');
  const redirectUrl = urlJoin(url.href, PUBLIC_PIN_PATH);

  if (!pinHash) {
    throw redirect(303, redirectUrl);
  }
  if (ticketId === null) {
    throw error(404, 'Bad ticket id');
  }

  const { token, ticket: _ticket, show: _show } = await getTicket(ticketId);

  if (!verifyPin(ticketId, _ticket.ticketState.reservation.pin, pinHash)) {
    throw redirect(303, redirectUrl);
  }

  const ticket = _ticket.toJSON() as TicketDocType;
  const show = _show.toJSON();

  return {
    token,
    ticket,
    show,
  };
};

export const actions: import('./$types').Actions = {
  buy_ticket: async ({ params }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'Key not found');
    }

    const { ticket, show } = await getTicket(ticketId);
    const amountToPay = show.price - ticket.ticketState.totalPaid;
    const transaction = await ticket.createTransaction({
      //TODO: add transaction data
      hash: '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e',
      from: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
      value: ticket.ticketState.price.toString(),
      block: 123,
      reason: TransactionReasonType.TICKET_PAYMENT,
    });
    const ticketService = createTicketMachineService(
      ticket.ticketState,
      ticket.saveTicketStateCallBack
    );
    ticketService.send({ type: 'PAYMENT RECEIVED', transaction });
    if (+transaction.value >= amountToPay) {
      const showService = createShowMachineService(
        show.showState,
        show.saveShowStateCallBack
      );
      showService.send({ type: 'TICKET SOLD', transaction, ticket });
    }
    //ticketService.stop();

    return { success: true };
  },
  cancel_ticket: async ({ params }) => {
    const ticketId = params.id;
    if (ticketId === null) {
      throw error(404, 'Key not found');
    }

    const { ticket } = await getTicket(ticketId);

    const ticketService = createTicketMachineService(
      ticket.ticketState,
      ticket.saveTicketStateCallBack
    );
    const state = ticketService.getSnapshot();
    console.log(state.value);
    if (state.can({ type: 'REQUEST CANCELLATION', cancel: undefined })) {
      //TODO: make real transaction

      ticketService.send({
        type: 'REQUEST CANCELLATION',
        cancel: {
          createdAt: new Date().getTime(),
          canceler: ActorType.CUSTOMER,
          canceledInState: JSON.stringify(state.value),
        },
      });
    }
    //ticketService.stop();
    return { success: true };
  },
};

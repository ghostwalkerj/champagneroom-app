import type { RedisOptionsType } from '$lib/constants';
import { ActorType, EntityType } from '$lib/constants';
import {
  ShowMachineEventString,
  createShowMachineService,
} from '$lib/machines/showMachine';
import type { TicketMachineEventType } from '$lib/machines/ticketMachine';
import {
  TicketMachineEventString,
  createTicketMachineService,
} from '$lib/machines/ticketMachine';
import type {
  ShowDocumentType,
  ShowFinalizedType,
  ShowStateType,
  ShowType,
} from '$lib/models/show';
import { Show } from '$lib/models/show';
import type {
  TicketDocumentType,
  TicketStateType,
  TicketType,
} from '$lib/models/ticket';
import { Ticket, TicketCancelReason } from '$lib/models/ticket';
import type {
  TransactionDocumentType,
  TransactionType,
} from '$lib/models/transaction';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { getQueue } from '.';

export type ShowJobDataType = {
  showId: string;
  [key: string]: any;
};

const saveState = (show: ShowDocumentType, newState: ShowStateType) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Show.updateOne({ _id: show._id }, { $set: { showState: newState } }).exec();
};

const createShowEvent = ({
  show,
  type,
  ticket,
  transaction,
}: {
  show: ShowDocumentType;
  type: string;
  ticket?: TicketDocumentType;
  transaction?: TransactionDocumentType;
}) => {
  mongoose.model('ShowEvent').create({
    show: show._id,
    type,
    ticket: ticket?._id,
    transaction: transaction?._id,
    agent: show.agent,
    talent: show.talent,
    ticketInfo: {
      name: ticket?.customerName,
      price: ticket?.price,
    },
  });
};

const getShowMachineService = (show: ShowType, showQueue: Queue) => {
  return createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async showState => saveState(show, showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
      jobQueue: showQueue,
    },
  });
};

export const getTicketMachineService = (
  ticket: TicketType,
  show: ShowType,
  showQueue: Queue
) => {
  const ticketMachineOptions = {
    saveStateCallback: (ticketState: TicketStateType) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Ticket.updateOne({ _id: ticket._id }, { $set: { ticketState } }).exec();
    },
  };

  return createTicketMachineService({
    ticketDocument: ticket,
    ticketMachineOptions,
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async showState => saveState(show, showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
      jobQueue: showQueue,
    },
  });
};
export const getShowWorker = (
  redisOptions: RedisOptionsType,
  mongoDBEndpoint: string
) => {
  return new Worker(
    EntityType.SHOW,
    async (job: Job<ShowJobDataType, any, ShowMachineEventString>) => {
      console.log('Show Worker:', job.name);
      switch (job.name) {
        case ShowMachineEventString.CANCELLATION_INITIATED: {
          cancelShow(job, redisOptions, mongoDBEndpoint);
          break;
        }
        case ShowMachineEventString.REFUND_INITIATED: {
          refundShow(job, redisOptions, mongoDBEndpoint);
          break;
        }
        case ShowMachineEventString.SHOW_ENDED: {
          finalizeShow(job, redisOptions, mongoDBEndpoint);
          break;
        }
      }
    },
    { autorun: false, connection: redisOptions.connection }
  );
};

const cancelShow = async (
  job: Job<ShowJobDataType, any, ShowMachineEventString>,
  redisOptions: RedisOptionsType,
  mongoDBEndpoint: string
) => {
  mongoose.connect(mongoDBEndpoint);
  const show = (await Show.findById(job.data.showId)) as ShowType;
  const showQueue = getQueue(EntityType.SHOW, redisOptions);
  const showService = getShowMachineService(show, showQueue);
  const showState = showService.getSnapshot();
  const tickets = await Ticket.find({
    show: show._id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'ticketState.active': true,
  });
  for (const ticket of tickets) {
    // send cancel show to all tickets
    const ticketService = getTicketMachineService(ticket, show, showQueue);
    const cancel = {
      cancelledBy: ActorType.TALENT,
      cancelledInState: JSON.stringify(showState.value),
      reason: TicketCancelReason.SHOW_CANCELLED,
      cancelledAt: new Date(),
    } as TicketStateType['cancel'];

    const cancelEvent = {
      type: TicketMachineEventString.SHOW_CANCELLED,
      cancel,
    } as TicketMachineEventType;
    ticketService.send(cancelEvent);
    ticketService.stop();
  }
  if (showState.matches('initiatedCancellation.waiting2Refund')) {
    showService.send(ShowMachineEventString.REFUND_INITIATED);
  }
  showService.stop();
};

const refundShow = async (
  job: Job<ShowJobDataType, any, ShowMachineEventString>,
  redisOptions: RedisOptionsType,
  mongoDBEndpoint: string
) => {
  mongoose.connect(mongoDBEndpoint);
  const show = (await Show.findById(job.data.showId)) as ShowType;
  const showQueue = getQueue(EntityType.SHOW, redisOptions);
  const showService = getShowMachineService(show, showQueue);

  // Check if show needs to send refunds
  const showState = showService.getSnapshot();
  if (showState.matches('initiatedCancellation.initiatedRefund')) {
    const tickets = await Ticket.find({
      show: show._id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'ticketState.active': true,
    });
    for (const ticket of tickets) {
      // send refunds
      //TODO: Send real transactions
      const ticketService = getTicketMachineService(ticket, show, showQueue);
      const ticketState = ticketService.getSnapshot();
      if (
        ticketState.matches('reserved.initiatedCancellation.waiting4Refund')
      ) {
        const ticket = ticketState.context.ticketDocument;
        const refundTransaction = (await Transaction.create({
          ticket: ticket._id,
          talent: ticket.talent,
          agent: ticket.agent,
          show: ticket.show,
          reason: TransactionReasonType.TICKET_REFUND,
          hash: '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e',
          from: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
          to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
          value:
            ticket.ticketState.totalPaid - ticket.ticketState.totalRefunded,
        })) as TransactionType;

        ticketService.send({
          type: TicketMachineEventString.REFUND_RECEIVED,
          transaction: refundTransaction,
        });
        ticketService.stop();
      }
    }
  }
  showService.stop();
};

const finalizeShow = async (
  job: Job<ShowJobDataType, any, ShowMachineEventString>,
  redisOptions: RedisOptionsType,
  mongoDBEndpoint: string
) => {
  mongoose.connect(mongoDBEndpoint);
  const show = (await Show.findById(job.data.showId)) as ShowType;
  const showQueue = getQueue(EntityType.SHOW, redisOptions);
  const showService = getShowMachineService(show, showQueue);

  // Check if show needs to send refunds
  const showState = showService.getSnapshot();
  if (showState.matches('inEscrow')) {
    const finalize = {
      finalizedAt: new Date(),
      finalizedBy: ActorType.TIMER,
    } as ShowFinalizedType;

    showService.send({
      type: ShowMachineEventString.SHOW_FINALIZED,
      finalize,
    });
  }
  showService.stop();
};

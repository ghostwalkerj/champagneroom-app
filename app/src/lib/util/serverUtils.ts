import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import {
  Show,
  type ShowDocType,
  type ShowStateType,
  type ShowType,
} from '$lib/models/show';
import {
  Ticket,
  type TicketDocType,
  type TicketStateType,
  type TicketType,
} from '$lib/models/ticket';
import type { TransactionDocType } from '$lib/models/transaction';
import { Queue } from 'bullmq';
import mongoose from 'mongoose';
import { EntityType } from './constants';
import { MONGO_DB_ENDPOINT, REDIS_OPTIONS } from './secrets';

const saveState = (show: ShowDocType, newState: ShowStateType) => {
  Show.updateOne({ _id: show._id }, { $set: { showState: newState } }).exec();
};

const createShowEvent = ({
  show,
  type,
  ticket,
  transaction,
}: {
  show: ShowDocType;
  type: string;
  ticket?: TicketDocType;
  transaction?: TransactionDocType;
}) => {
  mongoose.model('ShowEvent').create({
    show: show._id,
    type,
    ticket: ticket?._id,
    transaction: transaction?._id,
    agent: show.agent,
    talent: show.talent,
    ticketInfo: {
      name: ticket?.ticketState?.reservation?.name,
      price: ticket?.price,
    },
  });
};

export const getShowMachineService = (show: ShowType) => {
  const showQueue = new Queue(EntityType.SHOW, REDIS_OPTIONS);
  mongoose.connect(MONGO_DB_ENDPOINT);
  return createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => saveState(show, showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
      jobQueue: showQueue,
    },
  });
};

export const getShowMachineServiceFromId = async (showId: string) => {
  mongoose.connect(MONGO_DB_ENDPOINT);
  const show = await mongoose
    .model('Show')
    .findById(showId)
    .orFail(() => {
      throw new Error('Show not found');
    })
    .exec();

  return getShowMachineService(show);
};

export const getTicketMachineService = (ticket: TicketType, show: ShowType) => {
  mongoose.connect(MONGO_DB_ENDPOINT);
  const showQueue = new Queue(EntityType.SHOW, REDIS_OPTIONS);

  const ticketMachineOptions = {
    saveStateCallback: (ticketState: TicketStateType) => {
      Ticket.updateOne({ _id: ticket._id }, { $set: { ticketState } }).exec();
    },
  };

  return createTicketMachineService({
    ticketDocument: ticket,
    ticketMachineOptions,
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => saveState(show, showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
      jobQueue: showQueue,
    },
  });
};

export const getTicketMachineServiceFromId = async (TicketId: string) => {
  mongoose.connect(MONGO_DB_ENDPOINT);
  const ticket = await mongoose
    .model('Ticket')
    .findById(TicketId)
    .orFail(() => {
      throw new Error('Ticket not found');
    })
    .exec();

  const show = await mongoose
    .model('Show')
    .findById(ticket.show)
    .orFail(() => {
      throw new Error('Ticket not found');
    })
    .exec();

  return getTicketMachineService(ticket, show);
};

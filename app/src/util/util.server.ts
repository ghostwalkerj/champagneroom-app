import {
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_USERNAME,
} from '$env/static/private';
import { EntityType } from '$lib/constants';
import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import {
  Show,
  type ShowDocumentType,
  type ShowStateType,
  type ShowType,
} from '$lib/models/show';
import {
  Ticket,
  type TicketDocumentType,
  type TicketStateType,
  type TicketType,
} from '$lib/models/ticket';
import type { TransactionDocumentType } from '$lib/models/transaction';
import { getQueue } from '$lib/workers';
import IORedis from 'ioredis';
import mongoose from 'mongoose';

const saveState = (show: ShowDocumentType, newState: ShowStateType) => {
  Show.updateOne({ _id: show._id }, { $set: { showState: newState } }).exec();
};

const connection = new IORedis({
  host: REDIS_HOST,
  port: +REDIS_PORT,
  password: REDIS_PASSWORD,
  username: REDIS_USERNAME,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

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

export const getShowMachineService = (show: ShowType) => {
  const showQueue = getQueue(EntityType.SHOW, connection);
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

export const getShowMachineServiceFromId = async (showId: string) => {
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
  const showQueue = getQueue(EntityType.SHOW, connection);

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
      saveStateCallback: async showState => saveState(show, showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
      jobQueue: showQueue,
    },
  });
};

export const getTicketMachineServiceFromId = async (ticketId: string) => {
  const ticket = await mongoose
    .model('Ticket')
    .findById(ticketId)
    .orFail(() => {
      throw new Error('Ticket not found');
    })
    .exec();

  const show = await mongoose
    .model('Show')
    .findById(ticket.show)
    .orFail(() => {
      throw new Error('Show not found');
    })
    .exec();

  return getTicketMachineService(ticket, show);
};

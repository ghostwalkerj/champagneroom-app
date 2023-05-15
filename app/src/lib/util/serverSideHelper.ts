import {
  MONGO_DB_ENDPOINT,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_USERNAME,
} from '$env/static/private';
import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import type { ShowStateType, ShowType } from '$lib/models/show';
import type { TicketDocType, TicketType } from '$lib/models/ticket';
import type { TransactionDocType } from '$lib/models/transaction';
import { Queue } from 'bullmq';
import mongoose from 'mongoose';

export const redisOptions = {
  connection: {
    host: REDIS_HOST,
    port: +REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    enableReadyCheck: false,
  },
};

export const getShowMachineService = (show: ShowType) => {
  mongoose.connect(MONGO_DB_ENDPOINT);

  const saveState = (newState: ShowStateType) => {
    mongoose
      .model('Show')
      .updateOne({ _id: show._id }, { $set: { showState: newState } })
      .exec();
  };
  const showQueue = new Queue('show', redisOptions);
  const createShowEvent = ({
    type,
    ticket,
    transaction,
  }: {
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

  return createShowMachineService(show, {
    saveStateCallback: async showState => saveState(showState),
    saveShowEventCallback: async ({ type, ticket, transaction }) =>
      createShowEvent({ type, ticket, transaction }),
    jobQueue: showQueue,
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

export const getTicketMachineService = async (
  ticket: TicketType,
  show?: ShowType
) => {
  mongoose.connect(MONGO_DB_ENDPOINT);
  const _show =
    show ??
    (await mongoose
      .model('Show')
      .findById(ticket.show)
      .orFail(() => {
        throw new Error('Show not found');
      })
      .exec());

  return createTicketMachineService(ticket, _show, {
    saveStateCallback: ticketState => {
      mongoose
        .model('Ticket')
        .updateOne({ _id: ticket._id }, { $set: { ticketState } })
        .exec();
    },
  });
};

export const getTicketMachineServiceFromId = async (ticketId: string) => {
  mongoose.connect(MONGO_DB_ENDPOINT);

  const ticket = await mongoose
    .model('Ticket')
    .findById(ticketId)
    .orFail(() => {
      throw new Error('Ticket not found');
    })
    .exec();

  return getTicketMachineService(ticket);
};

import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import mongoose, { Error } from 'mongoose';

import { SaveState, type ShowType } from '$lib/models/show';
import { createShowEvent } from '$lib/models/showEvent';
import {
  Ticket,
  type TicketStateType,
  type TicketType,
} from '$lib/models/ticket';

import type { ShowMachineEventString } from '$lib/machines/showMachine';
import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';

import type { ShowJobDataType } from '$lib/workers/showWorker';

import { EntityType } from '$lib/constants';

export const getShowMachineService = (
  show: ShowType,
  connection: Queue<ShowJobDataType, any, ShowMachineEventString> | IORedis
) => {
  const jobQueue =
    connection instanceof Queue
      ? connection
      : (new Queue(EntityType.SHOW, { connection }) as Queue<
          ShowJobDataType,
          any,
          ShowMachineEventString
        >);

  return createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
      jobQueue,
    },
  });
};

export const getShowMachineServiceFromId = async (
  showId: string,
  connection: Queue<ShowJobDataType, any, ShowMachineEventString> | IORedis
) => {
  const jobQueue =
    connection instanceof Queue
      ? connection
      : (new Queue(EntityType.SHOW, { connection }) as Queue<
          ShowJobDataType,
          any,
          ShowMachineEventString
        >);
  const show = await mongoose
    .model('Show')
    .findById(showId)
    .orFail(() => {
      throw new Error('Show not found');
    })
    .exec();
  return getShowMachineService(show, jobQueue);
};

export const getTicketMachineService = (
  ticket: TicketType,
  show: ShowType,
  connection: Queue<ShowJobDataType, any, ShowMachineEventString> | IORedis
) => {
  const ticketMachineOptions = {
    saveStateCallback: (ticketState: TicketStateType) => {
      Ticket.updateOne({ _id: ticket._id }, { $set: { ticketState } }).exec();
    },
  };

  const jobQueue =
    connection instanceof Queue
      ? connection
      : (new Queue(EntityType.SHOW, { connection }) as Queue<
          ShowJobDataType,
          any,
          ShowMachineEventString
        >);

  return createTicketMachineService({
    ticketDocument: ticket,
    ticketMachineOptions,
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
      jobQueue,
    },
  });
};

export const getTicketMachineServiceFromId = async (
  ticketId: string,
  connection: Queue<ShowJobDataType, any, ShowMachineEventString> | IORedis
) => {
  const ticket = await mongoose
    .model('Ticket')
    .findById(ticketId)
    .orFail(() => {
      throw new Error('Ticket not found');
    })
    .exec();

  const jobQueue =
    connection instanceof Queue
      ? connection
      : (new Queue(EntityType.SHOW, { connection }) as Queue<
          ShowJobDataType,
          any,
          ShowMachineEventString
        >);

  const show = await mongoose
    .model('Show')
    .findById(ticket.show)
    .orFail(() => {
      throw new Error('Show not found');
    })
    .exec();

  return getTicketMachineService(ticket, show, jobQueue);
};

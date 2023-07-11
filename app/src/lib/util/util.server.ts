import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import mongoose, { Error } from 'mongoose';

import { SaveState, type ShowType } from '$lib/models/show';
import { createShowEvent } from '$lib/models/showEvent';
import {
    Ticket,
    type TicketStateType,
    type TicketType
} from '$lib/models/ticket';

import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { EntityType } from '$lib/constants';

export const getShowMachineService = (show: ShowType) => {
  return createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({
        type,
        ticketId,
        transaction,
        ticketInfo
      }) => createShowEvent({ show, type, ticketId, transaction, ticketInfo })
    }
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

export const getTicketMachineService = (
  ticket: TicketType,
  connection: ShowQueueType | IORedis
) => {
  const ticketMachineOptions = {
    saveStateCallback: (ticketState: TicketStateType) => {
      Ticket.updateOne({ _id: ticket._id }, { $set: { ticketState } }).exec();
    },
    showQueue:
      connection instanceof Queue
        ? connection
        : (new Queue(EntityType.SHOW, { connection }) as ShowQueueType)
  };

  return createTicketMachineService({
    ticketDocument: ticket,
    ticketMachineOptions
  });
};

export const getTicketMachineServiceFromId = async (
  ticketId: string,
  connection: ShowQueueType | IORedis
) => {
  const ticket = await mongoose
    .model('Ticket')
    .findById(ticketId)
    .orFail(() => {
      throw new Error('Ticket not found');
    })
    .exec();

  return getTicketMachineService(ticket, connection);
};

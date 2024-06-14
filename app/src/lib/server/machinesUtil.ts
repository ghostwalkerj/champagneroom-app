import type IORedis from 'ioredis';
import mongoose, { Error } from 'mongoose';

import type { ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import type { WalletDocument } from '$lib/models/wallet';
import { atomicUpdateCallback } from '$lib/models/wallet';

import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import { createWalletMachineService } from '$lib/machines/walletMachine';

export const getShowMachineServiceFromId = async (
  showId: string,
  redisConnection?: IORedis
) => {
  const show = (await mongoose
    .model('Show')
    .findById(showId)
    .orFail(() => {
      throw new Error('Show not found');
    })
    .exec()) as ShowDocument;
  return createShowMachineService({
    show,
    redisConnection
  });
};

export const getTicketMachineServiceFromId = async (
  ticketId: string,
  redisConnection: IORedis
) => {
  const ticket = (await mongoose
    .model('Ticket')
    .findById(ticketId)
    .populate('show')
    .orFail(() => {
      throw new Error('Ticket not found');
    })
    .exec()) as TicketDocument;

  return createTicketMachineService({
    ticket,
    show: ticket.show,
    redisConnection
  });
};

export const getWalletMachineService = (wallet: WalletDocument) => {
  return createWalletMachineService({
    wallet,
    walletMachineOptions: {
      atomicUpdateCallback
    }
  });
};

export const getWalletMachineServiceFromId = async (walletId: string) => {
  const show = await mongoose
    .model('Wallet')
    .findById(walletId)
    .orFail(() => {
      throw new Error('Wallet not found');
    })
    .exec();
  return getWalletMachineService(show);
};

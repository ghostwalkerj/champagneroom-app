import type IORedis from 'ioredis';
import mongoose, { Error } from 'mongoose';

import type { ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import type { WalletDocument } from '$lib/models/wallet';
import { atomicUpdateCallback } from '$lib/models/wallet';

import {
  createShowActor,
  type ShowActorType,
  type ShowMachineStateType
} from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import { createWalletMachineService } from '$lib/machines/walletMachine';

import { ActorType, CancelReason } from '$lib/constants';

export type ShowPermissionsType = {
  showId: string;
  stateValue: ShowMachineStateType['value'];
  showStopped: boolean;
  showCancelled: boolean;
  canCancelShow: boolean;
  canStartShow: boolean;
  canCreateShow: boolean;
  isActive: boolean;
};

/**
 * Retrieves a ShowMachineService instance based on the provided show ID.
 *
 * @param {string} showId - The ID of the show.
 * @param {IORedis} redisConnection - The Redis connection.
 * @return {Promise<ShowActorType>} A Promise that resolves to a ShowActorType instance.
 * @throws {Error} If the show with the provided ID is not found.
 */
export const getShowMachineServiceFromId = async (
  showId: string,
  redisConnection: IORedis
): Promise<ShowActorType> => {
  const show = (await mongoose
    .model('Show')
    .findById(showId)
    .orFail(() => {
      throw new Error('Show not found');
    })
    .exec()) as ShowDocument;
  return createShowActor({
    show,
    redisConnection
  }) as ShowActorType;
};

/**
 * Retrieves the permissions for a show based on the given state.
 *
 * @param {ShowMachineStateType | undefined} state - The state of the show machine.
 * @returns {ShowPermissionsType} The permissions for the show.
 */
export const getShowPermissions = (
  state?: ShowMachineStateType
): ShowPermissionsType => {
  if (state === undefined || !state.matches)
    return {
      showId: '',
      stateValue: 'showLoaded',
      showStopped: false,
      showCancelled: false,
      canCancelShow: false,
      canStartShow: false,
      canCreateShow: true,
      isActive: false
    } as ShowPermissionsType;

  const showPermissions = {
    showId: state.context.show._id.toString(),
    stateValue: state.value,
    showStopped: state.matches('stopped'),
    showCancelled: state.matches('cancelled'),
    canCancelShow: state.can({
      type: 'CANCELLATION INITIATED',
      cancel: {
        cancelledAt: new Date(),
        cancelledBy: ActorType.CREATOR,
        reason: CancelReason.CREATOR_CANCELLED
      }
    }),
    canCreateShow: !state.context.show.showState.isActive,
    canStartShow: state.can({
      type: 'SHOW STARTED'
    }),
    isActive: state.context.show.showState.isActive
  };
  return showPermissions;
};

/**
 * Retrieves the permissions for a show based on the provided show document and Redis connection.
 *
 * @param {object} options - The options object.
 * @param {ShowDocument | undefined} options.show - The show document.
 * @param {IORedis} options.redisConnection - The Redis connection.
 * @return {ShowPermissionsType} The permissions for the show.
 */
export const getShowPermissionsFromShow = ({
  show,
  redisConnection
}: {
  show: ShowDocument | undefined;
  redisConnection: IORedis;
}): ShowPermissionsType => {
  if (!show) {
    return getShowPermissions();
  }
  const showService = createShowActor({
    show,
    redisConnection
  });

  const showMachineState = showService.getSnapshot();
  const showPermissions = getShowPermissions(showMachineState);
  showService.stop();
  return showPermissions;
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

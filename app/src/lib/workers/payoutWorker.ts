import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { Types } from 'mongoose';

import { CancelReason, type CancelType } from '$lib/models/common';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import type { DisplayInvoice } from '$lib/bitcart/models';
import { ActorType, EntityType } from '$lib/constants';
import { PayoutType } from '$lib/util/payment';
import { getTicketMachineServiceFromId } from '$lib/util/util.server';

export const getPayoutWorker = ({
  redisConnection,
  paymentAuthToken
}: {
  redisConnection: IORedis;
  paymentAuthToken: string;
}) => {
  return new Worker(
    EntityType.PAYOUT,
    async (job: Job<PayoutJobDataType, any, string>) => {
      const payoutType = job.name as PayoutType;

      switch (payoutType) {
        case PayoutType.REFUND: {
          const ticketId = job.data.ticketId;
          if (!ticketId) {
            return;
          }

          const issueRefund = async (invoice: DisplayInvoice) => {
            const ticketService = await getTicketMachineServiceFromId(
              ticketId,
              redisConnection
            );

            const ticketState = ticketService.getSnapshot();

            const cancel = {
              _id: new Types.ObjectId(),
              cancelledBy: ActorType.TIMER,
              cancelledInState: JSON.stringify(ticketState.value),
              cancelledAt: new Date(),
              reason: CancelReason.TICKET_PAYMENT_TIMEOUT
            } as CancelType;

            ticketService.send({
              type: TicketMachineEventString.CANCELLATION_INITIATED,
              cancel
            });
          };
          issueRefund(invoice);
          break;
        }

        default: {
          break;
        }
      }
    },
    { autorun: false, connection: redisConnection }
  );
};

export type PayoutJobDataType = {
  [key: string]: any;
};

export type PayoutQueueType = Queue<PayoutJobDataType, any, PayoutType>;

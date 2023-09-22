import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { Types } from 'mongoose';

import { CancelReason, type CancelType } from '$lib/models/common';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import { getInvoiceByIdInvoicesModelIdGet } from '$lib/bitcart';
import type { DisplayInvoice } from '$lib/bitcart/models';
import { ActorType, EntityType, InvoiceStatus } from '$lib/constants';
import { getTicketMachineServiceFromId } from '$lib/util/util.server';

export const getPaymentWorker = ({
  redisConnection,
  paymentAuthToken
}: {
  redisConnection: IORedis;
  paymentAuthToken: string;
}) => {
  return new Worker(
    EntityType.PAYMENT,
    async (job: Job<PaymentJobDataType, any, string>) => {
      const invoiceId = job.data.invoiceId;
      const status = job.name as InvoiceStatus;

      const invoice =
        (invoiceId &&
          (
            (await getInvoiceByIdInvoicesModelIdGet(invoiceId, {
              headers: {
                Authorization: `Bearer ${paymentAuthToken}`,
                'Content-Type': 'application/json'
              }
            })) as AxiosResponse<DisplayInvoice>
          ).data) ||
        undefined;

      if (!invoice) {
        return;
      }

      if (invoice.status !== status) {
        return;
      }

      switch (status) {
        case InvoiceStatus.EXPIRED: {
          const expiredInvoice = async (invoice: DisplayInvoice) => {
            const ticketId = invoice.order_id;
            if (!ticketId) {
              return;
            }

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
          expiredInvoice(invoice);
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

export type PaymentJobDataType = {
  invoiceId: string;
  [key: string]: any;
};

export type PaymentQueueType = Queue<PaymentJobDataType, any, string>;

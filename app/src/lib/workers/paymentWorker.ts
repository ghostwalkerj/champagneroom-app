import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { Types } from 'mongoose';

import { CancelReason, type CancelType } from '$lib/models/common';
import { Ticket } from '$lib/models/ticket';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import { getInvoiceByIdInvoicesModelIdGet } from '$lib/bitcart';
import type { DisplayInvoice } from '$lib/bitcart/models';
import { ActorType, EntityType } from '$lib/constants';
import { InvoiceStatus, type PaymentType } from '$lib/util/payment';
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
        case InvoiceStatus.COMPLETE: {
          const completedInvoice = async (invoice: DisplayInvoice) => {
            const ticketId = invoice.order_id;
            if (!ticketId) {
              return;
            }

            const ticketService = await getTicketMachineServiceFromId(
              ticketId,
              redisConnection
            );

            const ticket = await Ticket.findById(ticketId);
            const payments = invoice.payments;

            // loop through payments and create transactions
            let index = 0;
            for (const payment of payments as PaymentType[]) {
              const hash =
                invoice.tx_hashes && invoice.tx_hashes[index]
                  ? invoice.tx_hashes[index]
                  : '';
              const transaction = new Transaction({
                ticket: ticketId,
                creator: ticket?.creator,
                agent: ticket?.agent,
                show: ticket?.show,
                hash,
                from: payment.user_address,
                to: payment.payment_address,
                reason: TransactionReasonType.TICKET_PAYMENT,
                amount: payment.amount,
                rate: payment.rate,
                currency: payment.currency,
                confirmations: payment.confirmations,
                total: (+payment.amount * +payment.rate).toFixed(2)
              });
              console.log('transaction', transaction);

              await Transaction.create(transaction);

              ticketService.send({
                type: TicketMachineEventString.PAYMENT_RECEIVED,
                transaction
              });
              index++;
            }
          };
          completedInvoice(invoice);
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

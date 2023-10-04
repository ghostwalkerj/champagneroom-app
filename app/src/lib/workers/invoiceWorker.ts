import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { Types } from 'mongoose';

import { CancelReason, type CancelType } from '$lib/models/common';
import { Ticket } from '$lib/models/ticket';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import {
  getInvoiceByIdInvoicesModelIdGet,
  modifyInvoiceInvoicesModelIdPatch,
  updatePaymentDetailsInvoicesModelIdDetailsPatch
} from '$lib/bitcart';
import type { DisplayInvoice } from '$lib/bitcart/models';
import { ActorType, EntityType } from '$lib/constants';
import { InvoiceJobType, InvoiceStatus, type PaymentType } from '$lib/util/payment';
import { getTicketMachineServiceFromId } from '$lib/util/util.server';

export const getInvoiceWorker = ({
  redisConnection,
  paymentAuthToken
}: {
  redisConnection: IORedis;
  paymentAuthToken: string;
}) => {
  return new Worker(
    EntityType.INVOICE,
    async (job: Job<InvoiceJobDataType, any, InvoiceJobType>) => {
      const invoiceId = job.data.invoiceId;
      const jobType = job.name as InvoiceJobType;

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

      switch (jobType) {
        case InvoiceJobType.INITIATE_PAYMENT: {
          // Create Invoice in Bitcart
          const paymentId = job.data.paymentId;
          const address = job.data.address;

          if (!paymentId || !address) {
            return;
          }

          try {
            updatePaymentDetailsInvoicesModelIdDetailsPatch(
              invoiceId,
              {
                id: paymentId,
                address
              },
              {
                headers: {
                  Authorization: `Bearer ${paymentAuthToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (error_) {
            console.error(error_);
          }
          break;
        }

        case InvoiceJobType.CANCEL: {
          try {
            invoiceId &&
              (await modifyInvoiceInvoicesModelIdPatch(
                invoiceId,
                {
                  status: InvoiceStatus.INVALID,
                  exception_status: 'Cancelled by customer'
                },
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              ));
          } catch (error_) {
            console.error('Update invoice error', error_);
          }

          break;
        }

        case InvoiceJobType.UPDATE: {
          const status = invoice.status;
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
        }
      }
    },
    { autorun: false, connection: redisConnection }
  );
};

export type InvoiceJobDataType = {
  invoiceId: string;
  [key: string]: any;
};

export type InvoiceQueueType = Queue<InvoiceJobDataType, any, string>;

import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { Types } from 'mongoose';

import { CancelReason, type CancelType } from '$lib/models/common';
import type { TicketType } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';
import type { TransactionType } from '$lib/models/transaction';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import { ActorType, EntityType } from '$lib/constants';
import {
  getInvoiceByIdInvoicesModelIdGet,
  getPayoutByIdPayoutsModelIdGet,
  getRefundInvoicesRefundsRefundIdGet,
  modifyInvoiceInvoicesModelIdPatch,
  updatePaymentDetailsInvoicesModelIdDetailsPatch
} from '$lib/ext/bitcart';
import type { DisplayInvoice, DisplayPayout } from '$lib/ext/bitcart/models';
import {
  InvoiceJobType,
  InvoiceStatus,
  type PaymentType
} from '$lib/util/payment';
import {
  getTicketMachineService,
  getTicketMachineServiceFromId
} from '$lib/util/util.server';

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
                  type: TicketMachineEventString.CANCELLATION_REQUESTED,
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
                  }) as TransactionType;

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

            case InvoiceStatus.REFUNDED: {
              console.log('Invoice Refunded');
              // Get the refund, payout, and ticket
              // Create a return transaction
              const refundedInvoice = async (invoice: DisplayInvoice) => {
                try {
                  const refundId = invoice.refund_id;
                  if (!refundId) {
                    return;
                  }

                  const ticketId = invoice.order_id;
                  if (!ticketId) {
                    return;
                  }

                  const ticket = (await Ticket.findById(
                    ticketId
                  )) as TicketType;

                  let response = await getRefundInvoicesRefundsRefundIdGet(
                    refundId,
                    {
                      headers: {
                        Authorization: `Bearer ${paymentAuthToken}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                  const refund = response.data;

                  const payoutId = refund.payout_id;
                  if (!payoutId) {
                    return;
                  }

                  response = await getPayoutByIdPayoutsModelIdGet(payoutId, {
                    headers: {
                      Authorization: `Bearer ${paymentAuthToken}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  const payout = response.data as unknown as DisplayPayout;

                  if (!payout) {
                    return;
                  }

                  // Create transaction for ticket and send to ticket machine
                  const transaction = new Transaction({
                    ticket: ticketId,
                    creator: ticket?.creator,
                    agent: ticket?.agent,
                    show: ticket?.show,
                    payout: payout.tx_hash,
                    from: ticket.paymentAddress,
                    to: payout.destination,
                    reason: TransactionReasonType.TICKET_REFUND,
                    amount: payout.amount,
                    currency: payout.currency
                  });

                  const ticketService = getTicketMachineService(
                    ticket,
                    redisConnection
                  );

                  ticketService.send({
                    type: TicketMachineEventString.REFUND_RECEIVED,
                    transaction
                  });
                } catch (error_) {
                  console.error(error_);
                }
              };
              refundedInvoice(invoice);
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

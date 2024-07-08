import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';

import { cancelSchema } from '$lib/models/common';
import type { TicketDocument } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';
import type { TransactionDocument } from '$lib/models/transaction';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';

import { createTicketMachineService } from '$lib/machines/ticketMachine';

import { ActorType, CancelReason, EntityType } from '$lib/constants';
import {
  getInvoiceByIdInvoicesModelIdGet,
  getPayoutByIdPayoutsModelIdGet,
  getRefundInvoicesRefundsRefundIdGet,
  modifyInvoiceInvoicesModelIdPatch,
  updatePaymentDetailsInvoicesModelIdDetailsPatch
} from '$lib/ext/bitcart';
import type { DisplayInvoice, DisplayPayout } from '$lib/ext/bitcart/models';
import {
  type BitcartConfig,
  createTicketInvoice,
  InvoiceJobType,
  InvoiceStatus,
  type PaymentType,
  PayoutReason
} from '$lib/payments';
import { getTicketMachineServiceFromId } from '$lib/server/machinesUtil';

export type InvoiceJobDataType = {
  bcInvoiceId: string;
  [key: string]: any;
};

export type InvoiceQueueType = Queue<InvoiceJobDataType, any, string>;

export const getInvoiceWorker = ({
  redisConnection,
  authToken,
  bcConfig
}: {
  redisConnection: IORedis;
  authToken: string;
  bcConfig: BitcartConfig;
}) => {
  return new Worker(
    EntityType.INVOICE,
    async (job: Job<InvoiceJobDataType, any, InvoiceJobType>) => {
      const jobType = job.name as InvoiceJobType;
      switch (jobType) {
        case InvoiceJobType.CANCEL: {
          const bcInvoiceId = job.data.bcInvoiceId;
          try {
            bcInvoiceId &&
              (await modifyInvoiceInvoicesModelIdPatch(
                bcInvoiceId,
                {
                  status: InvoiceStatus.INVALID,
                  exception_status: 'Cancelled by customer'
                },
                {
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              ));
          } catch (error_) {
            console.error(error_);
            return 'Update invoice error';
          }
          break;
        }
        case InvoiceJobType.UPDATE: {
          const bcInvoiceId = job.data.bcInvoiceId;
          const invoice =
            (bcInvoiceId &&
              (
                (await getInvoiceByIdInvoicesModelIdGet(bcInvoiceId, {
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                  }
                })) as AxiosResponse<DisplayInvoice>
              ).data) ||
            undefined;
          if (!invoice) {
            return 'No invoice found';
          }
          const status = invoice.status;
          switch (status) {
            case InvoiceStatus.EXPIRED: {
              const expiredInvoice = async (invoice: DisplayInvoice) => {
                const ticketId = invoice.order_id;
                if (!ticketId) {
                  return 'No ticket id';
                }

                const ticketService = await getTicketMachineServiceFromId(
                  ticketId,
                  redisConnection
                );

                const cancel = cancelSchema.parse({
                  cancelledBy: ActorType.TIMER,
                  cancelledInState: ticketService.getSnapshot().value,
                  reason: CancelReason.TICKET_PAYMENT_TIMEOUT
                });
                ticketService.send({
                  type: 'CANCELLATION REQUESTED',
                  cancel
                });
                ticketService.stop();
                return 'success';
              };
              return expiredInvoice(invoice);
            }
            case InvoiceStatus.COMPLETE: {
              const completedInvoice = async (invoice: DisplayInvoice) => {
                const ticketId = invoice.order_id;
                if (!ticketId) {
                  return 'No ticket id';
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
                    currency: payment.currency.toUpperCase(),
                    confirmations: payment.confirmations,
                    total: (+payment.amount * +payment.rate).toFixed(2)
                  }) as TransactionDocument;

                  await Transaction.create(transaction);

                  ticketService.send({
                    type: 'PAYMENT RECEIVED',
                    transaction
                  });

                  index++;
                }
                ticketService.stop();
                return 'success';
              };
              return completedInvoice(invoice);
            }
            case InvoiceStatus.REFUNDED: {
              // Get the refund, payout, and ticket
              // Create a return transaction
              const refundInvoice = async (invoice: DisplayInvoice) => {
                try {
                  const refundId = invoice.refund_id;
                  if (!refundId) {
                    console.error('No refund id');
                    return 'No refund id';
                  }

                  const ticketId = invoice.order_id;
                  if (!ticketId) {
                    console.error('No ticket id');
                    return 'No ticket id';
                  }

                  const ticket = (await Ticket.findById(ticketId)
                    .populate('show')
                    .orFail(() => {
                      throw new Error('Ticket not found');
                    })) as TicketDocument;

                  let response = await getRefundInvoicesRefundsRefundIdGet(
                    refundId,
                    {
                      headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                  const refund = response.data;

                  const payoutId = refund.payout_id;
                  if (!payoutId) {
                    console.error('No payout id');
                    return 'No payout id';
                  }

                  response = await getPayoutByIdPayoutsModelIdGet(payoutId, {
                    headers: {
                      Authorization: `Bearer ${authToken}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  const bcPayout = response.data as unknown as DisplayPayout;

                  if (!bcPayout) {
                    console.error('No payout');
                    return 'No payout';
                  }

                  const reason = bcPayout.metadata
                    ?.payoutReason as PayoutReason;

                  if (!reason) {
                    console.error('No payout reason');
                    return 'No payout reason';
                  }

                  // Create transaction for ticket and send to ticket machine
                  const transaction = await Transaction.create({
                    ticket: ticketId,
                    creator: ticket?.creator,
                    agent: ticket?.agent,
                    show: ticket?.show,
                    payout: bcPayout.tx_hash,
                    from: ticket.paymentAddress,
                    to: bcPayout.destination,
                    reason:
                      reason === PayoutReason.SHOW_REFUND
                        ? TransactionReasonType.TICKET_REFUND
                        : TransactionReasonType.DISPUTE_RESOLUTION,
                    amount: bcPayout.amount,
                    currency: bcPayout.currency?.toUpperCase()
                  });

                  const ticketService = createTicketMachineService({
                    ticket,
                    show: ticket.show,
                    redisConnection
                  });

                  ticketService.send({
                    type: 'REFUND RECEIVED',
                    transaction
                  });
                  ticketService.stop();
                } catch (error_) {
                  console.error(error_);
                  return 'Refund error';
                }
                return 'success';
              };
              return refundInvoice(invoice);
            }
            default: {
              return 'no op';
            }
          }
        }
        case InvoiceJobType.CREATE: {
          const ticketId = job.data.ticketId;
          if (!ticketId) {
            return 'No ticket ID';
          }
          const ticket = (await Ticket.findById(ticketId)
            .populate('show')
            .orFail(() => {
              console.error('Ticket not found');
              throw new Error('Ticket not found');
            })) as TicketDocument;

          try {
            const invoice = (await createTicketInvoice({
              ticket,
              token: authToken,
              bcConfig
            })) as DisplayInvoice;
            const ticketService = createTicketMachineService({
              ticket,
              show: ticket.show,
              redisConnection
            });
            ticketService.send({
              type: 'INVOICE RECEIVED',
              invoice
            });
            ticketService.stop();
            return 'success';
          } catch (error_) {
            console.error(error_);
            return 'Invoice error';
          }
        }

        case InvoiceJobType.UPDATE_ADDRESS: {
          const ticketId = job.data.ticketId;
          if (!ticketId) {
            return 'No ticket ID';
          }
          const ticket = (await Ticket.findById(ticketId).orFail(() => {
            throw new Error('Ticket not found');
          })) as TicketDocument;
          const paymentId = job.data.paymentId;
          if (!paymentId) {
            return 'No payment ID';
          }
          const paymentAddress = job.data.paymentAddress;
          if (!paymentAddress) {
            return 'No address';
          }
          if (ticket.bcInvoiceId === undefined) {
            return 'No invoice ID';
          }

          try {
            updatePaymentDetailsInvoicesModelIdDetailsPatch(
              ticket.bcInvoiceId,
              {
                id: paymentId,
                address: paymentAddress
              },
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (error_) {
            console.error(error_);
          }

          break;
        }

        default: {
          return 'no op';
        }
      }
    },
    { autorun: false, connection: redisConnection }
  );
};

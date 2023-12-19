import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';

import { cancelZodSchema } from '$lib/models/common';
import type { TicketDocument } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';
import type { TransactionDocument } from '$lib/models/transaction';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';

import {
  ActorType,
  CancelReason,
  EntityType,
  TicketMachineEventString
} from '$lib/constants';
import {
  getInvoiceByIdInvoicesModelIdGet,
  getPayoutByIdPayoutsModelIdGet,
  getRefundInvoicesRefundsRefundIdGet,
  modifyInvoiceInvoicesModelIdPatch
} from '$lib/ext/bitcart';
import type { DisplayInvoice, DisplayPayout } from '$lib/ext/bitcart/models';
import {
  InvoiceJobType,
  InvoiceStatus,
  type PaymentType,
  PayoutReason
} from '$lib/payment';
import {
  getTicketMachineService,
  getTicketMachineServiceFromId
} from '$lib/server/machinesUtil';

export type InvoiceJobDataType = {
  bcInvoiceId: string;
  [key: string]: any;
};

export type InvoiceQueueType = Queue<InvoiceJobDataType, any, string>;

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
      const bcInvoiceId = job.data.bcInvoiceId;
      const jobType = job.name as InvoiceJobType;

      const invoice =
        (bcInvoiceId &&
          (
            (await getInvoiceByIdInvoicesModelIdGet(bcInvoiceId, {
              headers: {
                Authorization: `Bearer ${paymentAuthToken}`,
                'Content-Type': 'application/json'
              }
            })) as AxiosResponse<DisplayInvoice>
          ).data) ||
        undefined;

      if (!invoice) {
        return 'No invoice found';
      }

      switch (jobType) {
        case InvoiceJobType.CANCEL: {
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
                    Authorization: `Bearer ${paymentAuthToken}`,
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

                const ticketState = ticketService.getSnapshot();
                const cancel = cancelZodSchema.parse({
                  cancelledBy: ActorType.TIMER,
                  cancelledInState: JSON.stringify(ticketState.value),
                  reason: CancelReason.TICKET_PAYMENT_TIMEOUT
                });
                if (
                  ticketState.can({
                    type: TicketMachineEventString.CANCELLATION_REQUESTED,
                    cancel
                  })
                ) {
                  ticketService.send({
                    type: TicketMachineEventString.CANCELLATION_REQUESTED,
                    cancel
                  });
                }
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
                    type: TicketMachineEventString.PAYMENT_RECEIVED,
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

                  const ticket = (await Ticket.findById(
                    ticketId
                  )) as TicketDocument;

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
                    console.error('No payout id');
                    return 'No payout id';
                  }

                  response = await getPayoutByIdPayoutsModelIdGet(payoutId, {
                    headers: {
                      Authorization: `Bearer ${paymentAuthToken}`,
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

                  const ticketService = getTicketMachineService(
                    ticket,
                    redisConnection
                  );

                  ticketService.send({
                    type: TicketMachineEventString.REFUND_RECEIVED,
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
      }
    },
    { autorun: false, connection: redisConnection }
  );
};

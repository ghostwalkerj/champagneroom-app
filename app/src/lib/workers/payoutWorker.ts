import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';

import { CurrencyType } from '$lib/models/common';
import { Ticket } from '$lib/models/ticket';

import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import { EntityType } from '$lib/constants';
import {
  batchActionsOnPayoutsPayoutsBatchPost,
  getInvoiceByIdInvoicesModelIdGet,
  modifyPayoutPayoutsModelIdPatch,
  refundInvoiceInvoicesModelIdRefundsPost,
  submitRefundInvoicesRefundsRefundIdSubmitPost
} from '$lib/ext/bitcart';
import type { DisplayInvoice } from '$lib/ext/bitcart/models';
import type { PaymentType } from '$lib/util/payment';
import { PayoutJobType, PayoutStatus } from '$lib/util/payment';
import { getTicketMachineService } from '$lib/util/util.server';

export type PayoutJobDataType = {
  [key: string]: any;
};

export type PayoutQueueType = Queue<PayoutJobDataType, any, PayoutJobType>;

export const getPayoutWorker = ({
  payoutQueue,
  redisConnection,
  paymentAuthToken,
  paymentPeriod = 6_000_000 / 60 / 1000,
  paymentNotificationUrl = ''
}: {
  payoutQueue: PayoutQueueType;
  redisConnection: IORedis;
  paymentAuthToken: string;
  paymentPeriod: number;
  paymentNotificationUrl: string;
}) => {
  return new Worker(
    EntityType.PAYOUT,
    async (job: Job<PayoutJobDataType, any, string>) => {
      const payoutType = job.name as PayoutJobType;
      // create ticket refund

      switch (payoutType) {
        case PayoutJobType.CREATE_REFUND: {
          const invoiceId = job.data.invoiceId;
          if (!invoiceId) {
            return;
          }

          const ticketId = job.data.ticketId;
          if (!ticketId) {
            return;
          }

          const ticket = await Ticket.findById(ticketId);
          if (!ticket) {
            return;
          }

          const ticketService = getTicketMachineService(
            ticket,
            redisConnection
          );

          const ticketState = ticketService.getSnapshot();

          const response = (await getInvoiceByIdInvoicesModelIdGet(invoiceId, {
            headers: {
              Authorization: `Bearer ${paymentAuthToken}`,
              'Content-Type': 'application/json'
            }
          })) as AxiosResponse<DisplayInvoice>;
          const invoice = response.data as DisplayInvoice;

          // Possible there is unconfirmed payments.  If so, queue it up again and wait for timeout.
          if (ticketState.matches('reserved.initiatedPayment')) {
            payoutQueue.add(
              PayoutJobType.CREATE_REFUND,
              {
                invoiceId
              },
              { delay: paymentPeriod }
            );
            return;
          }

          if (!ticketState.matches('reserved.refundRequested')) {
            return;
          }

          const issueRefund = async () => {
            try {
              const payment = invoice.payments?.[0] as PaymentType;
              const returnAddress = payment.user_address; // Just send the return as lump sum to first address

              // Tell the ticketMachine REFUND INITIATED
              const ticketRefund = ticket.ticketState.refund;
              if (!ticketRefund) {
                throw new Error('Ticket refund not found');
              }

              const currency = (invoice.paid_currency?.toUpperCase() ||
                CurrencyType.ETH) as CurrencyType;

              const approvedAmounts = new Map<CurrencyType, number>();
              approvedAmounts.set(currency, +invoice.sent_amount);

              ticketRefund.approvedAmounts = approvedAmounts;

              ticketService.send({
                type: TicketMachineEventString.REFUND_INITIATED,
                refund: ticketRefund
              });

              let response = await refundInvoiceInvoicesModelIdRefundsPost(
                invoiceId,
                {
                  amount: +invoice.sent_amount || 0,
                  currency: invoice.paid_currency || '',
                  admin_host: '',
                  send_email: false
                },
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              let refund = response.data;

              // Set refund address from the original invoice
              response = await submitRefundInvoicesRefundsRefundIdSubmitPost(
                refund.id,
                { destination: returnAddress },
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              refund = response.data;

              if (!refund.payout_id) {
                throw new Error('No payout ID returned from Bitcart API');
              }

              // Set the notification URL for the payout
              response = await modifyPayoutPayoutsModelIdPatch(
                refund.payout_id,
                {
                  notification_url: paymentNotificationUrl
                },
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              // Approve the payout
              response = await batchActionsOnPayoutsPayoutsBatchPost(
                {
                  ids: [refund.payout_id],
                  command: 'approve'
                },
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              // Send the payout
              response = await batchActionsOnPayoutsPayoutsBatchPost(
                {
                  ids: [refund.payout_id],
                  command: 'send'
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
          };
          issueRefund();
          break;
        }

        case PayoutJobType.PAYOUT_UPDATE: {
          console.log('Payout update');
          console.log('Status', job.data.status);

          switch (job.data.status) {
            case PayoutStatus.SENT: {
              // update ticket with refund status if this is a refund
              break;
            }

            default: {
              break;
            }
          }
        }

        default: {
          break;
        }
      }
    },
    { autorun: false, connection: redisConnection }
  );
};

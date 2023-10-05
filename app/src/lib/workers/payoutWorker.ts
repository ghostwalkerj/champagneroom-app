import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';

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
import { InvoiceStatus, PayoutJobType } from '$lib/util/payment';

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

      switch (payoutType) {
        case PayoutJobType.CREATE_REFUND: {
          const invoiceId = job.data.invoiceId;
          if (!invoiceId) {
            return;
          }

          const response = (await getInvoiceByIdInvoicesModelIdGet(invoiceId, {
            headers: {
              Authorization: `Bearer ${paymentAuthToken}`,
              'Content-Type': 'application/json'
            }
          })) as AxiosResponse<DisplayInvoice>;
          const invoice = response.data as DisplayInvoice;

          // Possible there is unconfirmed payments.  If so, queue it up again and wait for timeout.
          if (
            invoice.status === InvoiceStatus.IN_PROGRESS ||
            invoice.status === InvoiceStatus.PENDING
          ) {
            payoutQueue.add(
              PayoutJobType.CREATE_REFUND,
              {
                invoiceId
              },
              { delay: paymentPeriod }
            );
            return;
          }

          const issueRefund = async () => {
            try {
              const payment = invoice.payments?.[0] as PaymentType;
              const returnAddress = payment.user_address; // Just send the return as lump sum to first address
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
              // Approve the payout
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

export type PayoutQueueType = Queue<PayoutJobDataType, any, PayoutJobType>;

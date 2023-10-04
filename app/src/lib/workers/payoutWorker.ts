import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';

import {
  getInvoiceByIdInvoicesModelIdGet,
  refundInvoiceInvoicesModelIdRefundsPost
} from '$lib/bitcart';
import type { DisplayInvoice } from '$lib/bitcart/models';
import { EntityType } from '$lib/constants';
import { InvoiceStatus, PayoutType } from '$lib/util/payment';

export const getPayoutWorker = ({
  payoutQueue,
  redisConnection,
  paymentAuthToken,
  paymentPeriod = 6_000_000 / 60 / 1000
}: {
  payoutQueue: PayoutQueueType;
  redisConnection: IORedis;
  paymentAuthToken: string;
  paymentPeriod: number;
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
          console.log('invoice', invoice);

          // Possible there is unconfirmed payments.  If so, queue it up again and wait for timeout.
          if (
            invoice.status === InvoiceStatus.IN_PROGRESS ||
            invoice.status === InvoiceStatus.PENDING
          ) {
            payoutQueue.add(
              PayoutType.REFUND,
              {
                ticketId,
                invoiceId
              },
              { delay: paymentPeriod }
            );
            return;
          }

          const issueRefund = async () => {
            try {
              const refund = await refundInvoiceInvoicesModelIdRefundsPost(
                invoiceId,
                {
                  amount: 0.005_997_07,
                  currency: invoice.paid_currency || '',
                  admin_host: 'https://bitcart1.pcall.app/admin',
                  send_email: false
                },
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              console.log('refund', refund);
            } catch (error_) {
              console.error(error_);
            }
          };
          issueRefund();
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

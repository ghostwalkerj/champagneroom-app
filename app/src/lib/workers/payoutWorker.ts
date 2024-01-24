import type { AxiosResponse } from 'axios';
import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import urlJoin from 'url-join';

import type { PayoutType } from '$lib/models/common';
import { Creator } from '$lib/models/creator';
import type { TicketDocument } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';
import {
  Transaction,
  type TransactionDocument,
  TransactionReasonType
} from '$lib/models/transaction';
import { Wallet } from '$lib/models/wallet';

import config from '$lib/config';
import {
  CurrencyType,
  EntityType,
  TicketMachineEventString,
  WalletMachineEventString
} from '$lib/constants';
import { authEncrypt } from '$lib/crypt';
import {
  batchActionsOnPayoutsPayoutsBatchPost,
  createPayoutPayoutsPost,
  getInvoiceByIdInvoicesModelIdGet,
  getPayoutByIdPayoutsModelIdGet,
  getStoreByIdStoresModelIdGet,
  getWalletByIdWalletsModelIdGet,
  modifyPayoutPayoutsModelIdPatch,
  refundInvoiceInvoicesModelIdRefundsPost,
  submitRefundInvoicesRefundsRefundIdSubmitPost
} from '$lib/ext/bitcart';
import type {
  DisplayInvoice,
  DisplayPayout,
  Store,
  Wallet as BTWallet
} from '$lib/ext/bitcart/models';
import type { PaymentType } from '$lib/payout';
import { PayoutJobType, PayoutReason, PayoutStatus } from '$lib/payout';
import {
  getTicketMachineService,
  getWalletMachineService
} from '$lib/server/machinesUtil';

export type PayoutJobDataType = {
  [key: string]: any;
};

const authSalt = process.env.AUTH_SALT || '';
const bcStoreId = process.env.BITCART_STORE_ID || '';
const payoutNotificationUrl = process.env.PAYOUT_NOTIFICATION_URL || '';

export type PayoutQueueType = Queue<PayoutJobDataType, any, PayoutJobType>;

export const getPayoutWorker = ({
  payoutQueue,
  redisConnection,
  paymentAuthToken
}: {
  payoutQueue: PayoutQueueType;
  redisConnection: IORedis;
  paymentAuthToken: string;
}) => {
  return new Worker(
    EntityType.PAYOUT,
    async (job: Job<PayoutJobDataType, any, string>) => {
      const payoutType = job.name as PayoutJobType;
      switch (payoutType) {
        case PayoutJobType.REFUND_SHOW: {
          const issueRefund = async () => {
            const bcInvoiceId = job.data.bcInvoiceId;
            if (!bcInvoiceId) {
              return 'No invoice ID';
            }

            const ticketId = job.data.ticketId;
            if (!ticketId) {
              return 'No ticket ID';
            }

            const ticket = (await Ticket.findById(ticketId)) as TicketDocument;
            if (!ticket) {
              return 'No ticket found';
            }

            const ticketService = getTicketMachineService(
              ticket,
              redisConnection
            );

            const ticketState = ticketService.getSnapshot();

            const response = (await getInvoiceByIdInvoicesModelIdGet(
              bcInvoiceId,
              {
                headers: {
                  Authorization: `Bearer ${paymentAuthToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )) as AxiosResponse<DisplayInvoice>;
            const invoice = response.data as DisplayInvoice;

            // Possible there is unconfirmed payments.  If so, queue it up again and wait for timeout.
            if (ticketState.matches('reserved.initiatedPayment')) {
              payoutQueue.add(
                PayoutJobType.REFUND_SHOW,
                {
                  bcInvoiceId
                },
                { delay: config.TIMER.paymentPeriod }
              );
              return 'Unconfirmed payment';
            }

            if (!ticketState.matches('reserved.refundRequested')) {
              return 'Not in refund requested state';
            }

            try {
              const payment = invoice.payments?.[0] as PaymentType;
              const returnAddress = payment.user_address; // Just send the return as lump sum to first address

              // Tell the ticketMachine REFUND INITIATED
              const ticketRefund = ticket.ticketState.refund;
              if (!ticketRefund) {
                console.error('Ticket refund not found');
                return 'Ticket refund not found';
              }

              ticketRefund.approvedAmount = +invoice.sent_amount;

              ticketService.send({
                type: TicketMachineEventString.REFUND_INITIATED,
                refund: ticketRefund
              });

              let response = await refundInvoiceInvoicesModelIdRefundsPost(
                bcInvoiceId,
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
              let bcRefund = response.data;

              // Set refund address from the original invoice
              response = await submitRefundInvoicesRefundsRefundIdSubmitPost(
                bcRefund.id,
                { destination: returnAddress },
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              bcRefund = response.data;

              if (!bcRefund.payout_id) {
                console.error('No payout ID returned from Bitcart API');
                return 'No payout ID returned from Bitcart API';
              }

              // Set the notification URL for the payout

              response = await modifyPayoutPayoutsModelIdPatch(
                bcRefund.payout_id,
                {
                  notification_url: payoutNotificationUrl,
                  metadata: {
                    payoutReason: PayoutReason.SHOW_REFUND
                  }
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
                  ids: [bcRefund.payout_id],
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
                  ids: [bcRefund.payout_id],
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
              return 'Refund error';
            }
          };
          issueRefund();
          return 'success';
        }
        case PayoutJobType.DISPUTE_PAYOUT: {
          const issueAward = async () => {
            try {
              const ticketId = job.data.ticketId;
              if (!ticketId) {
                return 'No ticket ID';
              }

              const ticket = (await Ticket.findById(
                ticketId
              )) as TicketDocument;
              if (!ticket) {
                return 'No ticket found';
              }

              const bcInvoiceId = ticket.bcInvoiceId;
              if (!bcInvoiceId) {
                return 'No invoice ID';
              }

              const ticketService = getTicketMachineService(
                ticket,
                redisConnection
              );

              const ticketState = ticketService.getSnapshot();

              let response = (await getInvoiceByIdInvoicesModelIdGet(
                bcInvoiceId,
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              )) as AxiosResponse<DisplayInvoice>;
              const invoice = response.data as DisplayInvoice;

              if (!ticketState.matches('ended.inDispute')) {
                return 'Ticket not in Dispute state';
              }
              const payment = invoice.payments?.[0] as PaymentType;
              const currency = (invoice.paid_currency?.toUpperCase() ||
                CurrencyType.ETH) as CurrencyType;

              const returnAddress = payment.user_address; // Just send the return as lump sum to first address
              if (!ticket.ticketState.refund) {
                console.error('No refund found');
                return 'No refund found';
              }
              console.log(
                'ticket.ticketState.refund',
                ticket.ticketState.refund
              );
              const amount = ticket.ticketState.refund.approvedAmount;
              if (!amount) {
                console.error('No approved amount');
                return 'No approved amount';
              }

              response = await refundInvoiceInvoicesModelIdRefundsPost(
                bcInvoiceId,
                {
                  amount,
                  currency,
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
              let bcRefund = response.data;
              if (!bcRefund) {
                console.error('No refund created');
                return 'No refund created';
              }

              // Set refund address from the original invoice
              response = await submitRefundInvoicesRefundsRefundIdSubmitPost(
                bcRefund.id!,
                { destination: returnAddress },
                {
                  headers: {
                    Authorization: `Bearer ${paymentAuthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              bcRefund = response.data;
              if (!bcRefund.payout_id) {
                console.error('No payout ID returned from Bitcart API');
                return 'No payout ID returned from Bitcart API';
              }

              // Set the notification URL for the payout
              const encryptedPayoutId =
                authEncrypt(bcRefund.payout_id, authSalt) ?? '';
              let notificationUrl = '';

              if (payoutNotificationUrl && payoutNotificationUrl !== '') {
                notificationUrl = urlJoin(
                  payoutNotificationUrl,
                  encryptedPayoutId
                );
              }

              response = await modifyPayoutPayoutsModelIdPatch(
                bcRefund.payout_id,
                {
                  notification_url: notificationUrl,
                  metadata: {
                    payoutReason: PayoutReason.DISPUTE
                  }
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
                  ids: [bcRefund.payout_id],
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
                  ids: [bcRefund.payout_id],
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
              return 'Refund error';
            }
          };
          issueAward();
          return 'success';
        }

        case PayoutJobType.PAYOUT_UPDATE: {
          const bcPayoutId = job.data.bcPayoutId;
          if (!bcPayoutId) {
            console.error('No payout ID');
            return 'No payout ID';
          }
          const status = job.data.status as string;
          if (!status) {
            console.error('No status');
            return 'No status';
          }

          // Get the payout

          const response = await getPayoutByIdPayoutsModelIdGet(bcPayoutId, {
            headers: {
              Authorization: `Bearer ${paymentAuthToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.data) {
            console.error('No payout found for ID:', bcPayoutId);
            return 'No payout found for ID:' + bcPayoutId;
          }

          const bcPayout = response.data as DisplayPayout;
          if (!bcPayout) {
            console.error('No payout');
            return 'No payout';
          }
          switch (status) {
            case PayoutStatus.SENT: {
              // Tell the walletMachine PAYOUT SENT
              const reason = bcPayout.metadata?.payoutReason as PayoutReason;

              switch (reason) {
                case PayoutReason.CREATOR_PAYOUT: {
                  {
                    const walletId = bcPayout.metadata?.walletId as string;
                    if (!walletId) {
                      console.error('No wallet ID');
                      return 'No wallet ID';
                    }
                    const wallet = await Wallet.findById(walletId);
                    if (!wallet) {
                      console.error('No wallet found for ID:', walletId);
                      return 'No wallet found for ID:' + walletId;
                    }
                    const walletService = getWalletMachineService(wallet);
                    const walletState = walletService.getSnapshot();
                    const creator = await Creator.findOne({
                      'user.wallet': walletId
                    }).lean();
                    if (!creator) {
                      console.error(
                        'No creator found for wallet ID:',
                        walletId
                      );
                      return 'No creator found for wallet ID:' + walletId;
                    }

                    const transaction = (await Transaction.create({
                      creator: creator._id,
                      agent: creator.agent,
                      hash: bcPayout.tx_hash,
                      to: bcPayout.destination,
                      reason: TransactionReasonType.CREATOR_PAYOUT,
                      amount: bcPayout.amount,
                      currency: wallet.currency,
                      bcPayoutId: bcPayout.id
                    })) as TransactionDocument;

                    if (
                      !walletState.can({
                        type: WalletMachineEventString.PAYOUT_SENT,
                        transaction
                      })
                    ) {
                      console.error('Cannot send payout:', wallet.status);
                      return 'Cannot send payout:' + wallet.status;
                    }

                    walletService.send({
                      type: WalletMachineEventString.PAYOUT_SENT,
                      transaction
                    });
                  }
                  return 'success';
                }
              }
            }

            case PayoutStatus.COMPLETE: {
              const reason = bcPayout.metadata?.payoutReason as PayoutReason;
              switch (reason) {
                case PayoutReason.CREATOR_PAYOUT: {
                  const walletId = bcPayout.metadata?.walletId as string;
                  if (!walletId) {
                    console.error('No wallet ID');
                    return 'No wallet ID';
                  }
                  const wallet = await Wallet.findById(walletId);
                  if (!wallet) {
                    console.error('No wallet found for ID:', walletId);
                    return 'No wallet found for ID:' + walletId;
                  }
                  const walletService = getWalletMachineService(wallet);

                  walletService.send({
                    type: WalletMachineEventString.PAYOUT_COMPLETE,
                    bcPayoutId
                  });
                  return 'success';
                }
              }
            }

            default: {
              return 'success';
            }
          }
        }

        case PayoutJobType.CREATE_PAYOUT: {
          const walletId = job.data.walletId;
          const payoutReason = job.data.payoutReason as PayoutReason;
          if (!walletId) {
            console.error('No wallet Id');
            return 'No wallet Id';
          }
          const destination = job.data.destination as string;
          if (!destination) {
            console.error('No destination');
            return 'No destination';
          }
          const amount = job.data.amount as number;
          if (!amount) {
            console.error('No amount');
            return 'No amount';
          }

          const wallet = await Wallet.findById(walletId);
          if (!wallet) {
            console.error('No wallet');
            return 'No wallet';
          }

          const walletService = getWalletMachineService(wallet);
          const walletState = walletService.getSnapshot();
          const payout = {
            amount,
            destination,
            payoutCurrency: wallet.currency
          } as PayoutType;

          if (
            !walletState.can({
              type: WalletMachineEventString.PAYOUT_REQUESTED,
              payout
            })
          ) {
            console.error('Cannot request payout:', wallet.status);
            return 'Cannot request payout:' + wallet.status;
          }

          // Ok, create the payout in bitcart
          // Get the store
          if (!bcStoreId || bcStoreId === '') {
            console.error('No bitcart store ID');
            return 'No bitcart store ID';
          }

          try {
            const response = await getStoreByIdStoresModelIdGet(bcStoreId, {
              headers: {
                Authorization: `Bearer ${paymentAuthToken}`,
                'Content-Type': 'application/json'
              }
            });
            if (!response.data) {
              console.error('No store found for ID:', bcStoreId);
              return 'No store found for ID:' + bcStoreId;
            }
            const store = response.data as Store;

            // Get the wallet, just use the first one for now
            const bcWalletId = store.wallets[0];
            if (!bcWalletId) {
              console.error('No wallet found for store ID:', bcStoreId);
              return 'No wallet found for store ID:' + bcStoreId;
            }
            const bcWalletResponse = await getWalletByIdWalletsModelIdGet(
              bcWalletId,
              {
                headers: {
                  Authorization: `Bearer ${paymentAuthToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            if (!bcWalletResponse.data) {
              console.error('No wallet found for ID:', bcWalletId);
              return 'No wallet found for ID:' + bcWalletId;
            }
            const bcWallet = bcWalletResponse.data as BTWallet;

            // Checks
            if (bcWallet.currency?.toUpperCase() !== wallet.currency) {
              console.error(
                'Wallet currency does not match expected currency:',
                bcWallet.currency,
                wallet.currency
              );
              return (
                'Wallet currency does not match expected currency:' +
                bcWallet.currency +
                wallet.currency
              );
            }

            if (+bcWallet.balance < amount) {
              console.error('Insufficient funds in wallet:', walletId);
              return 'Insufficient funds in wallet:' + walletId;
            }

            // Create the payout
            const bcPayoutResponse = await createPayoutPayoutsPost(
              {
                amount,
                destination,
                store_id: bcStoreId,
                wallet_id: bcWalletId,
                currency: wallet.currency,
                notification_url: payoutNotificationUrl,
                metadata: {
                  walletId,
                  payoutReason
                }
              },
              {
                headers: {
                  Authorization: `Bearer ${paymentAuthToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            if (!bcPayoutResponse.data) {
              console.error('No payout created');
              return 'No payout created';
            }

            const bcPayout = bcPayoutResponse.data;
            payout.bcPayoutId = bcPayout.id;
            payout.payoutStatus = bcPayout.status as PayoutStatus;

            walletService.send({
              type: WalletMachineEventString.PAYOUT_REQUESTED,
              payout
            });
          } catch (error_) {
            console.error(error_);
            return 'Payout error';
          }
          return 'success';
        }

        default: {
          return 'success';
        }
      }
    },
    { autorun: false, connection: redisConnection }
  );
};

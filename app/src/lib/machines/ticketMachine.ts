/* eslint-disable @typescript-eslint/naming-convention */

import type { Queue } from 'bullmq';
import { nanoid } from 'nanoid';
import { assign, interpret, raise, setup, type StateFrom } from 'xstate';

import type {
  DisputeType,
  FeedbackType,
  FinalizeType,
  RefundType,
  TransactionSummaryType
} from '$lib/models/common';
import {
  type CancelType,
  escrowSchema,
  finalizeSchema,
  redemptionSchema,
  refundSchema,
  type SaleType,
  ticketSaleSchema,
  transactionSummarySchema
} from '$lib/models/common';
import type { TicketDocument } from '$lib/models/ticket';
import type { TransactionDocument } from '$lib/models/transaction';

import type { ShowJobDataType } from '$lib/workers/showWorker';

import type { CurrencyType } from '$lib/constants';
import {
  ActorType,
  DisputeDecision,
  RefundReason,
  ShowMachineEventString,
  TicketStatus
} from '$lib/constants';
import { calcTotal } from '$lib/payout.js';

type TicketMachineContextType = {
  ticket: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
  errorMessage: string | undefined;
  id: string;
};

// type TicketMachineGuardType =
//   | { type: 'ticketCancelled' }
//   | { type: 'ticketFinalized' }
//   | { type: 'ticketInDispute' }
//   | { type: 'ticketInEscrow' }
//   | { type: 'ticketReserved' }
//   | { type: 'ticketRedeemed' }
//   | { type: 'ticketHasPaymentInitiated' }
//   | { type: 'ticketHasPayment' }
//   | { type: 'ticketFullyPaid' }
//   | { type: 'ticketHasRefundRequested' }
//   | { type: 'ticketIsWaitingForRefund' }
//   | { type: 'ticketMissedShow' }
//   | { type: 'canBeRefunded' }
//   | { type: 'fullyPaid' }
//   | { type: 'canWatchShow' }
//   | { type: 'noDisputeRefund' }
//   | { type: 'showMissed' }
//   | { type: 'ticketHasRefundRequested' }
//   | { type: 'ticketIsWaitingForRefund' }
//   | { type: 'ticketInDisputeRefund' }
//   | { type: 'fullyRefunded' };

export type TicketMachineEventType =
  | {
      type: 'CANCELLATION REQUESTED';
      cancel: CancelType;
    }
  | {
      type: 'REFUND RECEIVED';
      transaction: TransactionDocument;
    }
  | {
      type: 'REFUND REQUESTED';
      refund: RefundType;
    }
  | {
      type: 'REFUND INITIATED';
      refund: RefundType;
    }
  | {
      type: 'PAYMENT RECEIVED';
      transaction: TransactionDocument;
    }
  | {
      type: 'FEEDBACK RECEIVED';
      feedback: FeedbackType;
    }
  | {
      type: 'DISPUTE INITIATED';
      dispute: DisputeType;
      refund: RefundType;
    }
  | {
      type: 'TICKET REDEEMED';
    }
  | {
      type: 'SHOW JOINED';
    }
  | {
      type: 'SHOW LEFT';
    }
  | {
      type: 'SHOW ENDED';
    }
  | {
      type: 'SHOW CANCELLED';
      cancel: CancelType;
    }
  | {
      type: 'TICKET FINALIZED';
      finalize: FinalizeType;
    }
  | {
      type: 'DISPUTE DECIDED';
      decision: DisputeDecision;
      refund?: RefundType;
    }
  | {
      type: 'PAYMENT INITIATED';
      paymentCurrency: CurrencyType;
    };

export type TicketMachineOptions = {
  gracePeriod?: number;
  escrowPeriod?: number;
  showQueue?: Queue<ShowJobDataType, any, string>;
  saveState?: boolean;
};

const createTicketMachine = ({
  ticket,
  ticketMachineOptions
}: {
  ticket: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
}) => {
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAxAMoASA8gOoAEAwgIIByLAogDK-cAIgG0ADAF1EoAA4B7WKjSzSUkAA9EAFgBMAGhABPRNoCM2zQDoAHCZObRVgOyaAnNqsuAvp-1osOAmIySlpGVk4efiFhE0kkEDkFJRV4jQQdfSMEEwBmF0cLAFYANjdtQtETYs0rYqtvXwxsPEIScgs-Zt5ZfAhICjE4mXlFVGVVNJzHQos7UWLi0ULzURcTZ0zEXNFLbRdC2tFHHM0qzRyGkE6A1uCOppxu3v6YoYSR5InEHMKZuYWlis1htDMYdjNKpoalZRDlio5HKJtJdri0gu1UU8+hABto3olRuNUogrHpQQhzG4LKZHNUctp5vkTCiHmi2mB7v5kFiXjl8R8xilQGltKZqcVfgdCvS3BVHJsEMUfhZXDlYZopSYdpoWVzAuzOV0etiBpp+UlBV8EFM-vYAct7MDNAqzAdqfs1vYEXZcrrmvq7pjjS9CubCUL1IhHGSstpSjMpnDnCVRKtkT4rqyAxjWTyccJimHPsSEMsFWq4yqrGqXOdYfNmRnUdmOUHnvnHEXLSWGSZxZKrNK9uUjgrRS4inkXE5HGtlm5in6buiOQAnOBgVcAN36oWY3A4gmiElUBOLwq2NgK6wZLhyHkKjisGXJJysFlh09K1cfn51TazW52nXWBNx3CALAAd3wUZSCgTQAAV8AMABbMBSGQCgELYABNXADwAFSYAAlbgeAASQANWPLsiQvbJYWKIpChqaZYQRGF5XJKxn1mJUjlycxim0RxG0aPUgLXDdt0gKCYLQODEOQtCMKw3D8I4IjSIo6iRFiU8BToyMEGOSw7RE4oTEfcpygVUkciKbYTGfeltkKJc2TuECwNk6DYPgpDUPQzD2C4PheDYAjyLoDgmHIjhyKiyKaIMi0jLSZyRNmaNVnvfYnxfLIqlEixZwOI48lsJwLgAiSVwsbyZIgvyFIC5TgooULIgiqKYrihKkoI6J9PiM9u3orVK1+ViKimJ9R3JMwsufOMdGqdZan-cT-UkhrpPAuT-KUoLVMGVLwytSamOmpxZo4hasmrd8qhyMxNAWWkdhq7blwNRqDpash4KoIhZEg6h6GYAApOh4pS0bDIjDKr2y288sfFa7PmUqtVTFx+Oc+YPJbPbQKaiwyFGfBkEgFh8FIdAwAAGyZ6nBUO1rNGIsAADMAFdSBxUiADEAFVDxIsjuCo+HhjSpHL3WVHcofAqY0vUVZl+WwrMfKzYWJ3b-tkym0Gp2n6cZlm2eUDmga53mBaF7gxYl7Tpd015zvPYy7DhaxCnyJw4xOUxihdON30ZUUKjOWpF1qnb6vXSAwDQnE9yYARhYIs6Eflq1ykRCw8g1VadjMeEFWcbRqVx8rVcHQ3k7AVP04hsIYbhkQT3zi6ewqGZzjYwp1hyV7nXJaoZmmOo7xOSonzEzM6r+1u+nbzODyPHvaIVxV1YpZw+0TGEpkHJ9n2bg0yG4WB0FXMGKGF7ghAAITYFgAGlJZ02X3gLiWU4DlTKImcDKQccYxxgOyg4aMJQ3AmHyNfO4t976P3BoIciVAEKiyGv1RK5Fkq729uNYywDSonDAecPYkDw7kncI+Sci94Q-Eyu5ROv1UGkDvg-J+UVv7cCIsLeKbBeDkQAFr-zGulLQuRKGaGoRA5Y9DYyWVEDjaYNlR52BKN4DMpBZB9HgPEZsklSGyIQAAWlUYgfYH57Cpicc4xwKCcxcjzBY-ehUtjlDMkcJYUJFHVAcG4qSZNwJeKtHUJi5laRWXgbZckxwmKVBrGsfI+wRJhNJj5Zq8l7aBRUsgKJJYEQQjYQcKYfspgKjcJYfGllqzOSsq9HJxt8lHRBmDUpE0fhmQ1Kcaos5KiijsucCwCxXqvWmtUdMP1PLAX2ibUgVMaYQDpgzZmrMfYyP3rkHiAcg7RiVDoKoLpCZFFKKYKEmToztOWRBU2qBzYbMttsm2pA7aKW5vzQWvTfZyhVK4Coz4mS2BdHCCcyxtB5VpAcJwDy26QABSKZyTF7xqmEh4H4cJbEIBcpMpUop3Bwq8JwxZHJ0DvJZiivuPs0UuAnDUDUr1ygShKIfUwqxZh2HODxIu30V5JwNDzMg+AmaoAAF50rlv3eidILD4wXNKFiiwzDQJ5YsesiwGT0iODktBfDIKouMHeSZlRiV2HxrUQo0CmHaoWMJcB2SKUkzIIIVAsBpB8xpqaxUSsJTwhYnixYs5yyLyrK9L6DJR6uoWSTFCXrQIQG6Sa+lZCMrTlrvSeyHhFHLFhOWao4olT5EshUI4719GeCAA */
  return setup({
    types: {
      events: {} as TicketMachineEventType,
      context: {} as TicketMachineContextType
    },
    actions: {
      sendJoinedShow: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.CUSTOMER_JOINED,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString()
          }
        );
      },

      sendLeftShow: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.CUSTOMER_LEFT,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString()
          }
        );
      },

      sendTicketSold: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_SOLD,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString(),
            sale: params.ticket.ticketState.sale
          }
        );
      },

      sendTicketRedeemed: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_REDEEMED,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString()
          }
        );
      },

      sendTicketRefunded: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_REFUNDED,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString(),
            refund: params.ticket.ticketState.refund
          }
        );
      },

      sendTicketCancelled: (
        _,
        params: { cancel: CancelType; ticket: TicketDocument; }
      ) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_CANCELLED,
          {
            showId: ticket.show.toString(),
            ticketId: ticket._id.toString(),
            customerName: ticket.user.name,
            cancel: params.cancel
          }
        );
      },

      sendTicketFinalized: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_FINALIZED,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString()
          }
        );
      },

      sendDisputeInitiated: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_DISPUTED,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString(),
            dispute: params.ticket.ticketState.dispute
          }
        );
      },

      requestRefundCancelledShow: (
        _,
        params: { cancel: CancelType; ticket: TicketDocument; }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.REFUND_REQUESTED;
          ticket.ticketState.cancel = params.cancel;
          ticket.ticketState.refund = refundSchema.parse({
            requestedAmounts: ticket.ticketState.sale?.total,
            approvedAmounts: ticket.ticketState.sale?.total,
            reason: RefundReason.SHOW_CANCELLED
          });
          return {
            ticket
          };
        });
      },

      initiatePayment: (_, params: { ticket: TicketDocument; paymentCurrency: CurrencyType}) => {
        assign(() => {
        const ticket = params.ticket;
        const paymentCurrency = params.paymentCurrency;
        ticket.ticketState.status = TicketStatus.PAYMENT_INITIATED;
        ticket.ticketState.sale = ticketSaleSchema.parse({
          totals: {
            [paymentCurrency]: 0
          },
          payments: [],
          currency: paymentCurrency
        }) as SaleType;
        return {
          ticket
        };
        });
      },

      setFullyPaid: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.FULLY_PAID;
          return { ticket };
        });
      },

      redeemTicket: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          if (ticket.ticketState.status === TicketStatus.REDEEMED)
            return { ticket };
          ticket.ticketState.status = TicketStatus.REDEEMED;
          ticket.ticketState.redemption = redemptionSchema.parse({});
          return { ticket };
        });
      },

      cancelTicket: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.CANCELLED;
          return { ticket };
        });
      },

      receivePayment: (
        _,
        params: {
          ticket: TicketDocument;
          transaction: TransactionDocument;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const transaction = params.transaction;
          if (!ticket.ticketState.sale) return { ticket };
          const payment = transactionSummarySchema.parse({
            amount: transaction.amount,
            currency: transaction.currency.toUpperCase() as CurrencyType,
            rate: +(transaction.rate || 0),
            transaction: transaction._id
          });
          ticket.$inc('ticketState.sale.total', payment.amount);
          ticket.ticketState.sale.payments.push(payment);
          ticket.ticketState.status = TicketStatus.PAYMENT_RECEIVED;
          return { ticket };
        });
      },

      requestRefund: (
        _,
        params: {
          ticket: TicketDocument;
          refund: RefundType;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const refund = params.refund;
          ticket.ticketState.status = TicketStatus.REFUND_REQUESTED;
          ticket.ticketState.refund = refund;
          return { ticket };
        });
      },

      initiateRefund:  (
        _,
        params: {
          ticket: TicketDocument;
          refund: RefundType;
         }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const refund = params.refund;
          ticket.ticketState.status = TicketStatus.WAITING_FOR_REFUND;
          ticket.ticketState.refund = refund;
          return { ticket };
        });
      },

      receiveRefund: (
        _,
        params: {
          ticket: TicketDocument;
          transaction: TransactionDocument;
         }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const transaction = params.transaction;
          if (!ticket.ticketState.refund) return { ticket };
          const currency = transaction.currency.toUpperCase();
          const payout = transactionSummarySchema.parse({
            amount: +transaction.amount,
            currency,
            rate: +(transaction.rate || 0),
            transaction: transaction._id
          });
          ticket.ticketState.refund.payouts.push(payout);
          ticket.$inc('ticketState.refund.total', payout.amount);
          return { ticket };
        });
      },

      receiveFeedback:  (
        _,
        params: {
          ticket: TicketDocument;
          feedback: FeedbackType;
         }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const feedback = params.feedback;
        ticket.ticketState.feedback = feedback;
        return { ticket };
        });
      },

      initiateDispute:  (
        _,
        params: {
          ticket: TicketDocument;
          dispute: DisputeType;
          refund: RefundType;
         }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          if (!ticket.ticketState.sale) return { ticket };
          ticket.ticketState.status = TicketStatus.IN_DISPUTE;
          ticket.ticketState.dispute = params.dispute;
          ticket.ticketState.refund = params.refund;
          return { ticket };
        });
      },

      endShow: (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.IN_ESCROW;
          ticket.ticketState.escrow = escrowSchema.parse({});
          return { ticket };
        });
      },

      finalizeTicket: (
        _,
        params: {
          ticket: TicketDocument;
          finalize: FinalizeType;
         }
      ) => {
        assign(() => {
          const ticket = params.ticket;
        const finalize = params.finalize;
        if (ticket.ticketState.status === TicketStatus.FINALIZED)
          return { ticket };

        ticket.ticketState.status = TicketStatus.FINALIZED;
        ticket.ticketState.finalize = finalize;
        return { ticket };
        });
      },

      decideDispute:  (
        _,
        params: {
          ticket: TicketDocument;
          decision: DisputeDecision;
          refund: RefundType;
         }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const decision = params.decision;
          const refund = params.refund;

        if (!ticket.ticketState.dispute) return { ticket };
        ticket.ticketState.dispute.decision = decision;
        ticket.ticketState.dispute.endedAt = new Date();
        ticket.ticketState.dispute.resolved = true;
        ticket.ticketState.refund = refund;
        ticket.ticketState.status = TicketStatus.WAITING_FOR_DISPUTE_REFUND;
        return { ticket };
        });
      },

      deactivateTicket:  (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        assign(() => {
          const ticket = params.ticket;
        ticket.ticketState.active = false;
        return { ticket };
        });
      },

      missShow:  (
        _,
        params: { ticket: TicketDocument; }
      ) => {
        assign(() => {
          const ticket = params.ticket;
        ticket.ticketState.status = TicketStatus.MISSED_SHOW;
        return { ticket };
        });
      }
    },
    guards: {
      ticketCancelled: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.CANCELLED,
      ticketFinalized: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.FINALIZED,
      ticketInDispute: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.IN_DISPUTE,
      ticketInEscrow: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.IN_ESCROW,
      ticketReserved: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.RESERVED,
      ticketRedeemed: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.REDEEMED,
      ticketHasPaymentInitiated: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.PAYMENT_INITIATED,
      ticketHasPayment: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.PAYMENT_RECEIVED,
      ticketFullyPaid: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.FULLY_PAID,
      ticketHasRefundRequested: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.REFUND_REQUESTED,
      ticketIsWaitingForRefund: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.WAITING_FOR_REFUND,
      ticketMissedShow: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.MISSED_SHOW,
      ticketInDisputeRefund: ({ context }) =>
        context.ticket.ticketState.status ===
        TicketStatus.WAITING_FOR_DISPUTE_REFUND,
      fullyPaid: ({ context, event }, params: { transaction: TransactionDocument; }) => {
        const { transaction } = params;
        const amount =
          event.type === 'PAYMENT RECEIVED' ? +transaction.amount : 0;
        let total = +(amount * +(transaction.rate || 0)).toFixed(0);

        // Check total payments with rates at time of transaction.
        const payouts = (context.ticket.ticketState.sale?.payments ||
          new Map<string, TransactionSummaryType[]>()) as Map<
          string,
          TransactionSummaryType[]
        >;
        total += calcTotal(payouts);
        return total >= context.ticket.price.amount;
      },
      showMissed: ({ context }) => {
        return (
          context.ticket.ticketState.redemption === undefined ||
          context.ticket.ticketState.redemption?.redeemedAt === undefined
        );
      },
      fullyRefunded: ({ context, event }) => {
        const refund = context.ticket.ticketState.refund;
        if (refund === undefined) return false;
        const refundApproved = refund.approvedAmount || 0;
        if (refundApproved === 0) return false;
        const amount =
          event.type === 'REFUND RECEIVED' ? +event.transaction?.amount : 0;
        const totalRefundsAmount = refund.total || 0 + amount;

        const refundedInTransactionCurrency =
          totalRefundsAmount >= refundApproved;

        return refundedInTransactionCurrency;
      },
      canWatchShow: ({ context }) => {
        return (
          context.ticket.ticketState.status === TicketStatus.REDEEMED ||
          context.ticket.ticketState.status === TicketStatus.FULLY_PAID
        );
      },
      canBeRefunded: ({ context }) => {
        const currency = context.ticket.price.currency;

        return (
          context.ticket.price.amount !== 0 &&
          (!context.ticket.ticketState.sale ||
            !context.ticket.ticketState.sale?.payments ||
            (context.ticket.ticketState.sale?.payments as any)[currency]
              ?.length === 0)
        );
      },

      noDisputeRefund: ({ context }, params : { decision: DisputeDecision; }) => {
        const decision =
          context.ticket.ticketState.dispute?.decision || params.decision;
        if (!decision) return false;
        return decision === DisputeDecision.NO_REFUND;
      }
    }
  }).createMachine({
    context: {
      ticket,
      ticketMachineOptions,
      errorMessage: undefined as string | undefined,
      id: nanoid()
    },
    id: 'ticketMachine',
    initial: 'ticketLoaded',
    states: {
      ticketLoaded: {
        always: [
          {
            target: 'reserved',
            guard: 'ticketReserved'
          },
          {
            target: '#ticketMachine.reserved.initiatedPayment',
            guard: 'ticketHasPaymentInitiated'
          },
          {
            target: '#ticketMachine.reserved.receivedPayment',
            guard: 'ticketHasPayment'
          },
          {
            target: '#ticketMachine.reserved.waiting4Show',
            guard: 'ticketFullyPaid'
          },
          {
            target: '#ticketMachine.reserved.refundRequested',
            guard: 'ticketHasRefundRequested'
          },
          {
            target: '#ticketMachine.reserved.waiting4Refund',
            guard: 'ticketIsWaitingForRefund'
          },
          {
            target: 'cancelled',
            guard: 'ticketCancelled'
          },
          {
            target: 'finalized',
            guard: 'ticketFinalized'
          },
          {
            target: 'redeemed',
            guard: 'ticketRedeemed'
          },
          {
            target: '#ticketMachine.ended.inEscrow',
            guard: 'ticketInEscrow'
          },
          {
            target: '#ticketMachine.ended.inDispute',
            guard: 'ticketInDispute'
          },
          {
            target: '#ticketMachine.ended.missedShow',
            guard: 'ticketMissedShow'
          },
          {
            target: '#ticketMachine.ended.inDispute.waiting4DisputeRefund',
            guard: 'ticketInDisputeRefund'
          }
        ]
      },
      reserved: {
        initial: 'waiting4Payment',
        on: {
          'SHOW CANCELLED': [
            {
              target: '#ticketMachine.reserved.refundRequested',
              actions: [{
                type: 'requestRefundCancelledShow',
                params: ({ context, event }) => ({
                  ticket: context.ticket,
                  cancel: event.cancel
                })
               }],
              guard: 'canBeRefunded'
            },
            {
              target: '#ticketMachine.cancelled',
              actions: ['cancelTicket', 'sendTicketCancelled']
            }
          ]
        },
        states: {
          waiting4Payment: {
            on: {
              'CANCELLATION REQUESTED': {
                target: '#ticketMachine.cancelled',
                actions: ['cancelTicket', 'sendTicketCancelled']
              },
              'PAYMENT INITIATED': {
                target: 'initiatedPayment',
                actions: ['initiatePayment']
              }
            }
          },
          initiatedPayment: {
            on: {
              'PAYMENT RECEIVED': [
                {
                  target: '#ticketMachine.reserved.waiting4Show',
                  guard: 'fullyPaid',
                  actions: ['receivePayment', 'setFullyPaid', 'sendTicketSold']
                },
                {
                  target: '#ticketMachine.reserved.receivedPayment',
                  actions: ['receivePayment']
                }
              ]
            }
          },
          receivedPayment: {
            // under paid
            on: {
              'PAYMENT RECEIVED': [
                {
                  target: '#ticketMachine.reserved.waiting4Show',
                  guard: 'fullyPaid',
                  actions: ['receivePayment', 'setFullyPaid', 'sendTicketSold']
                },
                {
                  actions: ['receivePayment']
                }
              ],
              'REFUND REQUESTED': {
                target: 'refundRequested',
                actions: ['requestRefund']
              }
            }
          },
          waiting4Show: {
            on: {
              'TICKET REDEEMED': {
                target: '#ticketMachine.redeemed',
                guard: 'canWatchShow',
                actions: ['redeemTicket', 'sendTicketRedeemed']
              },
              'REFUND REQUESTED': [
                {
                  target: 'refundRequested',
                  actions: ['requestRefund'],
                  guard: 'canBeRefunded'
                },
                {
                  target: '#ticketMachine.cancelled',
                  actions: [
                    'requestRefund',
                    'cancelTicket',
                    'sendTicketRefunded'
                  ]
                }
              ]
            }
          },
          refundRequested: {
            on: {
              'REFUND INITIATED': {
                target: 'waiting4Refund',
                actions: ['initiateRefund']
              }
            }
          },
          waiting4Refund: {
            on: {
              'REFUND RECEIVED': [
                {
                  target: '#ticketMachine.cancelled',
                  guard: 'fullyRefunded',
                  actions: [
                    'receiveRefund',
                    'cancelTicket',
                    'sendTicketRefunded'
                  ]
                },
                {
                  actions: ['receiveRefund']
                }
              ]
            }
          }
        }
      },
      redeemed: {
        on: {
          'SHOW LEFT': { actions: ['sendLeftShow'] },
          'SHOW JOINED': {
            guard: 'canWatchShow',
            actions: ['sendJoinedShow']
          }
        }
      },
      cancelled: {
        type: 'final',
        entry: ['deactivateTicket']
      },
      finalized: {
        type: 'final',
        entry: ['deactivateTicket']
      },
      ended: {
        initial: 'inEscrow',
        on: {
          'TICKET FINALIZED': {
            target: '#ticketMachine.finalized',
            actions: ['finalizeTicket', 'sendTicketFinalized']
          }
        },
        states: {
          inEscrow: {
            always: [
              {
                target: 'missedShow',
                guard: 'showMissed',
                actions: ['missShow']
              }
            ],
            on: {
              'FEEDBACK RECEIVED': {
                actions: [
                  'receiveFeedback',
                  raise({
                    type: 'TICKET FINALIZED',
                    finalize: finalizeSchema.parse({
                      finalizedBy: ActorType.CUSTOMER
                    })
                  })
                ]
              },
              'DISPUTE INITIATED': {
                target: 'inDispute',
                actions: ['initiateDispute', 'sendDisputeInitiated']
              }
            }
          },
          inDispute: {
            initial: 'waiting4Decision',
            states: {
              waiting4Decision: {
                on: {
                  'DISPUTE DECIDED': [
                    {
                      actions: [
                        'decideDispute',
                        raise({
                          type: 'TICKET FINALIZED',
                          finalize: finalizeSchema.parse({
                            finalizedBy: ActorType.ARBITRATOR
                          })
                        })
                      ],
                      guard: 'noDisputeRefund'
                    },
                    {
                      actions: 'decideDispute',
                      target: 'waiting4DisputeRefund'
                    }
                  ]
                }
              },
              waiting4DisputeRefund: {
                on: {
                  'REFUND RECEIVED': {
                    actions: [
                      'receiveRefund',
                      raise({
                        type: 'TICKET FINALIZED',
                        finalize: finalizeSchema.parse({
                          finalizedBy: ActorType.ARBITRATOR
                        })
                      })
                    ]
                  }
                }
              }
            }
          },
          missedShow: {
            on: {
              'DISPUTE INITIATED': {
                target: 'inDispute',
                actions: ['initiateDispute', 'sendDisputeInitiated']
              }
            }
          }
        }
      }
    },
    on: {
      'SHOW ENDED': {
        target: '#ticketMachine.ended',
        actions: ['endShow']
      }
    }
  });
};

export type TicketMachineServiceType = ReturnType<
  typeof createTicketMachineService
>;

export type TicketMachineStateType = StateFrom<
  ReturnType<typeof createTicketMachine>
>;

export type TicketMachineType = ReturnType<typeof createTicketMachine>;

export { type TicketMachineEventType };

  export { createTicketMachine };

export const createTicketMachineService = ({
  ticket,
  ticketMachineOptions
}: {
  ticket: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
}) => {
  const ticketMachine = createTicketMachine({
    ticket,
    ticketMachineOptions
  });
  const ticketService = interpret(ticketMachine).start();
  const saveState = ticketMachineOptions?.saveState || true;

  // if (saveState)
  //   ticketService.onChange(async ({ context }) => {
  //     if (context.ticket.save) await context.ticket.save();
  //   });

  return ticketService;
};

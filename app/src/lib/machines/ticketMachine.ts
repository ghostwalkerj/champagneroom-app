/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { Queue } from 'bullmq';
import { nanoid } from 'nanoid';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import { raise } from 'xstate/lib/actions';

import type { FeedbackType, TransactionSummaryType } from '$lib/models/common';
import {
  type CancelType,
  type DisputeType,
  escrowSchema,
  finalizeSchema,
  type FinalizeType,
  redemptionSchema,
  refundSchema,
  type RefundType,
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

export type TicketMachineOptions = {
  gracePeriod?: number;
  escrowPeriod?: number;
  showQueue?: Queue<ShowJobDataType, any, string>;
  saveState?: boolean;
};
type TicketMachineEventType =
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

const createTicketMachine = ({
  ticket,
  ticketMachineOptions
}: {
  ticket: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
}) => {
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAxAMoASA8gOoAEAwgIIByLAogDK-cAIgG0ADAF1EoAA4B7WKjSzSUkAA9EAFgBMAGhABPRNoCM2zQDoAHCZObRVgOyaAnNqsuAvp-1osOAmIySlpGVk4efiFhE0kkEDkFJRV4jQQdfSMEEwBmF0cLAFYANjdtQtETYs0rYqtvXwxsPEIScgs-Zt5ZfAhICjE4mXlFVGVVNJzHQos7UWLi0ULzURcTZ0zEXNFLbRdC2tFHHM0qzRyGkE6A1uCOppxu3v6YoYSR5InEHMKZuYWlis1htDMYdjNKpoalZRDlio5HKJtJdri0gu1UU8+hABto3olRuNUogrHpQQhzG4LKZHNUctp5vkTCiHmi2mB7v5kFiXjl8R8xilQGltKZqcVfgdCvS3BVHJsEMUfhZXDlYZopSYdpoWVzAuzOV0etiBpp+UlBV8EFM-vYAct7MDNAqzAdqfs1vYEXZcrrmvq7pjjS9CubCUL1IhHGSstpSjMpnDnCVRKtkT4rqyAxjWTyccJimHPsSEMsFWq4yqrGqXOdYfNmRnUdmOUHnvnHEXLSWGSZxZKrNK9uUjgrRS4inkXE5HGtlm5in6buiOQAnOBgVcAN36oWY3A4gmiElUBOLwq2NgK6wZLhyHkKjisGXJJysFlh09K1cfn51TazW52nXWBNx3CALAAd3wUZSCgTQAAV8AMABbMBSGQCgELYABNXADwAFSYAAlbgeAASQANWPLsiQvbJYWKIpChqaZYQRGF5XJKxn1mJUjlycxim0RxG0aPUgLXDdt0gKCYLQODEOQtCMKw3D8I4IjSIo6iRFiU8BToyMEGOSw7RE4oTEfcpygVUkciKbYTGfeltkKJc2TuECwNk6DYPgpDUPQzD2C4PheDYAjyLoDgmHIjhyKiyKaIMi0jLSZyRNmaNVnvfYnxfLIqlEixZwOI48lsJwLgAiSVwsbyZIgvyFIC5TgooULIgiqKYrihKkoI6J9PiM9u3orVK1+ViKimJ9R3JMwsufOMdGqdZan-cT-UkhrpPAuT-KUoLVMGVLwytSamOmpxZo4hasmrd8qhyMxNAWWkdhq7blwNRqDpash4KoIhZEg6h6GYAApOh4pS0bDIjDKr2y288sfFa7PmUqtVTFx+Oc+YPJbPbQKaiwyFGfBkEgFh8FIdAwAAGyZ6nBUO1rNGIsAADMAFdSBxUiADEAFVDxIsjuCo+HhjSpHL3WVHcofAqY0vUVZl+WwrMfKzYWJ3b-tkym0Gp2n6cZlm2eUDmga53mBaF7gxYl7Tpd015zvPYy7DhaxCnyJw4xOUxihdON30ZUUKjOWpF1qnb6vXSAwDQnE9yYARhYIs6Eflq1ykRCw8g1VadjMeEFWcbRqVx8rVcHQ3k7AVP04hsIYbhkQT3zi6ewqGZzjYwp1hyV7nXJaoZmmOo7xOSonzEzM6r+1u+nbzODyPHvaIVxV1YpZw+0TGEpkHJ9n2bg0yG4WB0FXMGKGF7ghAAITYFgAGlJZ02X3gLiWU4DlTKImcDKQccYxxgOyg4aMJQ3AmHyNfO4t976P3BoIciVAEKiyGv1RK5Fkq729uNYywDSonDAecPYkDw7kncI+Sci94Q-Eyu5ROv1UGkDvg-J+UVv7cCIsLeKbBeDkQAFr-zGulLQuRKGaGoRA5Y9DYyWVEDjaYNlR52BKN4DMpBZB9HgPEZsklSGyIQAAWlUYgfYH57Cpicc4xwKCcxcjzBY-ehUtjlDMkcJYUJFHVAcG4qSZNwJeKtHUJi5laRWXgbZckxwmKVBrGsfI+wRJhNJj5Zq8l7aBRUsgKJJYEQQjYQcKYfspgKjcJYfGllqzOSsq9HJxt8lHRBmDUpE0fhmQ1Kcaos5KiijsucCwCxXqvWmtUdMP1PLAX2ibUgVMaYQDpgzZmrMfYyP3rkHiAcg7RiVDoKoLpCZFFKKYKEmToztOWRBU2qBzYbMttsm2pA7aKW5vzQWvTfZyhVK4Coz4mS2BdHCCcyxtB5VpAcJwDy26QABSKZyTF7xqmEh4H4cJbEIBcpMpUop3Bwq8JwxZHJ0DvJZiivuPs0UuAnDUDUr1ygShKIfUwqxZh2HODxIu30V5JwNDzMg+AmaoAAF50rlv3eidILD4wXNKFiiwzDQJ5YsesiwGT0iODktBfDIKouMHeSZlRiV2HxrUQo0CmHaoWMJcB2SKUkzIIIVAsBpB8xpqaxUSsJTwhYnixYs5yyLyrK9L6DJR6uoWSTFCXrQIQG6Sa+lZCMrTlrvSeyHhFHLFhOWao4olT5EshUI4719GeCAA */
  return createMachine(
    {
      context: {
        ticket,
        ticketMachineOptions,
        errorMessage: undefined as string | undefined,
        id: nanoid()
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      tsTypes: {} as import('./ticketMachine.typegen.d.ts').Typegen0,
      schema: {
        events: {} as TicketMachineEventType
      },
      predictableActionArguments: true,
      id: 'ticketMachine',
      initial: 'ticketLoaded',
      states: {
        ticketLoaded: {
          always: [
            {
              target: 'reserved',
              cond: 'ticketReserved'
            },
            {
              target: '#ticketMachine.reserved.initiatedPayment',
              cond: 'ticketHasPaymentInitiated'
            },
            {
              target: '#ticketMachine.reserved.receivedPayment',
              cond: 'ticketHasPayment'
            },
            {
              target: '#ticketMachine.reserved.waiting4Show',
              cond: 'ticketFullyPaid'
            },
            {
              target: '#ticketMachine.reserved.refundRequested',
              cond: 'ticketHasRefundRequested'
            },
            {
              target: '#ticketMachine.reserved.waiting4Refund',
              cond: 'ticketIsWaitingForRefund'
            },
            {
              target: 'cancelled',
              cond: 'ticketCancelled'
            },
            {
              target: 'finalized',
              cond: 'ticketFinalized'
            },
            {
              target: 'redeemed',
              cond: 'ticketRedeemed'
            },
            {
              target: '#ticketMachine.ended.inEscrow',
              cond: 'ticketInEscrow'
            },
            {
              target: '#ticketMachine.ended.inDispute',
              cond: 'ticketInDispute'
            },
            {
              target: '#ticketMachine.ended.missedShow',
              cond: 'ticketMissedShow'
            },
            {
              target: '#ticketMachine.ended.inDispute.waiting4DisputeRefund',
              cond: 'ticketInDisputeRefund'
            }
          ]
        },
        reserved: {
          initial: 'waiting4Payment',
          on: {
            'SHOW CANCELLED': [
              {
                target: '#ticketMachine.reserved.refundRequested',
                actions: ['requestRefundCancelledShow'],
                cond: 'canBeRefunded'
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
                    cond: 'fullyPaid',
                    actions: [
                      'receivePayment',
                      'setFullyPaid',
                      'sendTicketSold'
                    ]
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
                    cond: 'fullyPaid',
                    actions: [
                      'receivePayment',
                      'setFullyPaid',
                      'sendTicketSold'
                    ]
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
                  cond: 'canWatchShow',
                  actions: ['redeemTicket', 'sendTicketRedeemed']
                },
                'REFUND REQUESTED': [
                  {
                    target: 'refundRequested',
                    actions: ['requestRefund'],
                    cond: 'canBeRefunded'
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
                    cond: 'fullyRefunded',
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
              cond: 'canWatchShow',
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
                  cond: 'showMissed',
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
                        cond: 'noDisputeRefund'
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
    },
    {
      actions: {
        sendJoinedShow: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.CUSTOMER_JOINED,
            {
              showId: context.ticket.show.toString(),
              ticketId: context.ticket._id.toString()
            }
          );
        },

        sendLeftShow: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.CUSTOMER_LEFT,
            {
              showId: context.ticket.show.toString(),
              ticketId: context.ticket._id.toString()
            }
          );
        },

        sendTicketSold: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_SOLD,
            {
              showId: context.ticket.show.toString(),
              ticketId: context.ticket._id.toString(),
              sale: context.ticket.ticketState.sale
            }
          );
        },

        sendTicketRedeemed: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_REDEEMED,
            {
              showId: context.ticket.show.toString(),
              ticketId: context.ticket._id.toString()
            }
          );
        },

        sendTicketRefunded: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_REFUNDED,
            {
              showId: context.ticket.show.toString(),
              ticketId: context.ticket._id.toString(),
              refund: context.ticket.ticketState.refund
            }
          );
        },

        sendTicketCancelled: (context, event) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_CANCELLED,
            {
              showId: context.ticket.show.toString(),
              ticketId: context.ticket._id.toString(),
              customerName: context.ticket.user.name,
              cancel: event.cancel
            }
          );
        },

        sendTicketFinalized: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_FINALIZED,
            {
              showId: context.ticket.show.toString(),
              ticketId: context.ticket._id.toString()
            }
          );
        },

        sendDisputeInitiated: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_DISPUTED,
            {
              showId: context.ticket.show.toString(),
              ticketId: context.ticket._id.toString(),
              dispute: context.ticket.ticketState.dispute
            }
          );
        },

        requestRefundCancelledShow: assign((context, event) => {
          const ticket = context.ticket;
          ticket.ticketState.status = TicketStatus.REFUND_REQUESTED;
          ticket.ticketState.cancel = event.cancel;
          ticket.ticketState.refund = refundSchema.parse({
            requestedAmounts: ticket.ticketState.sale?.total,
            approvedAmounts: ticket.ticketState.sale?.total,
            reason: RefundReason.SHOW_CANCELLED
          });
          return {
            ticket
          };
        }),

        initiatePayment: assign((context, event) => {
          const ticket = context.ticket;
          const paymentCurrency = event.paymentCurrency;
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
        }),

        setFullyPaid: assign((context) => {
          const ticket = context.ticket;
          ticket.ticketState.status = TicketStatus.FULLY_PAID;
          return { ticket };
        }),

        redeemTicket: assign((context) => {
          const ticket = context.ticket;
          if (context.ticket.ticketState.status === TicketStatus.REDEEMED)
            return { ticket };
          ticket.ticketState.status = TicketStatus.REDEEMED;
          ticket.ticketState.redemption = redemptionSchema.parse({});
          return { ticket };
        }),

        cancelTicket: assign((context) => {
          const ticket = context.ticket;
          ticket.ticketState.status = TicketStatus.CANCELLED;
          return { ticket };
        }),

        receivePayment: assign((context, event) => {
          const ticket = context.ticket;
          if (!ticket.ticketState.sale) return { ticket };
          const payment = transactionSummarySchema.parse({
            amount: +event.transaction.amount,
            currency: event.transaction.currency.toUpperCase() as CurrencyType,
            rate: +(event.transaction.rate || 0),
            transaction: event.transaction._id
          });
          ticket.$inc('ticketState.sale.total', payment.amount);
          ticket.ticketState.sale.payments.push(payment);
          ticket.ticketState.status = TicketStatus.PAYMENT_RECEIVED;
          return { ticket };
        }),

        requestRefund: assign((context, event) => {
          const ticket = context.ticket;
          ticket.ticketState.status = TicketStatus.REFUND_REQUESTED;
          ticket.ticketState.refund = event.refund;
          return { ticket };
        }),

        initiateRefund: assign((context, event) => {
          const ticket = context.ticket;
          ticket.ticketState.status = TicketStatus.WAITING_FOR_REFUND;
          ticket.ticketState.refund = event.refund;
          return { ticket };
        }),

        receiveRefund: assign((context, event) => {
          const ticket = context.ticket;
          if (!ticket.ticketState.refund) return { ticket };
          const currency = event.transaction.currency.toUpperCase();
          const payout = transactionSummarySchema.parse({
            amount: +event.transaction.amount,
            currency,
            rate: +(event.transaction.rate || 0),
            transaction: event.transaction._id
          });
          ticket.ticketState.refund.payouts.push(payout);
          ticket.$inc('ticketState.refund.total', payout.amount);
          return { ticket };
        }),

        receiveFeedback: assign((context, event) => {
          const ticket = context.ticket;
          ticket.ticketState.feedback = event.feedback;
          return { ticket };
        }),

        initiateDispute: assign((context, event) => {
          const ticket = context.ticket;
          if (!ticket.ticketState.sale) return { ticket };
          ticket.ticketState.status = TicketStatus.IN_DISPUTE;
          ticket.ticketState.dispute = event.dispute;
          ticket.ticketState.refund = event.refund;
          return { ticket };
        }),

        endShow: assign((context) => {
          const ticket = context.ticket;
          ticket.ticketState.status = TicketStatus.IN_ESCROW;
          ticket.ticketState.escrow = escrowSchema.parse({});
          return { ticket };
        }),

        finalizeTicket: assign((context, event) => {
          const ticket = context.ticket;
          const finalize = event.finalize;
          if (ticket.ticketState.status === TicketStatus.FINALIZED)
            return { ticket };

          ticket.ticketState.status = TicketStatus.FINALIZED;
          ticket.ticketState.finalize = finalize;
          return { ticket };
        }),

        decideDispute: assign((context, event) => {
          const ticket = context.ticket;
          if (!ticket.ticketState.dispute) return { ticket };
          ticket.ticketState.dispute.decision = event.decision;
          ticket.ticketState.dispute.endedAt = new Date();
          ticket.ticketState.dispute.resolved = true;
          ticket.ticketState.refund = event.refund;
          ticket.ticketState.status = TicketStatus.WAITING_FOR_DISPUTE_REFUND;
          return { ticket };
        }),

        deactivateTicket: assign((context) => {
          const ticket = context.ticket;
          ticket.ticketState.active = false;
          return { ticket };
        }),

        missShow: assign((context) => {
          const ticket = context.ticket;
          ticket.ticketState.status = TicketStatus.MISSED_SHOW;
          return { ticket };
        })
      },
      guards: {
        ticketCancelled: (context) =>
          context.ticket.ticketState.status === TicketStatus.CANCELLED,
        ticketFinalized: (context) =>
          context.ticket.ticketState.status === TicketStatus.FINALIZED,
        ticketInDispute: (context) =>
          context.ticket.ticketState.status === TicketStatus.IN_DISPUTE,
        ticketInEscrow: (context) =>
          context.ticket.ticketState.status === TicketStatus.IN_ESCROW,
        ticketReserved: (context) =>
          context.ticket.ticketState.status === TicketStatus.RESERVED,
        ticketRedeemed: (context) =>
          context.ticket.ticketState.status === TicketStatus.REDEEMED,
        ticketHasPaymentInitiated: (context) =>
          context.ticket.ticketState.status === TicketStatus.PAYMENT_INITIATED,
        ticketHasPayment: (context) =>
          context.ticket.ticketState.status === TicketStatus.PAYMENT_RECEIVED,
        ticketFullyPaid: (context) =>
          context.ticket.ticketState.status === TicketStatus.FULLY_PAID,
        ticketHasRefundRequested: (context) =>
          context.ticket.ticketState.status === TicketStatus.REFUND_REQUESTED,
        ticketIsWaitingForRefund: (context) =>
          context.ticket.ticketState.status === TicketStatus.WAITING_FOR_REFUND,
        ticketMissedShow: (context) =>
          context.ticket.ticketState.status === TicketStatus.MISSED_SHOW,
        ticketInDisputeRefund: (context) =>
          context.ticket.ticketState.status ===
          TicketStatus.WAITING_FOR_DISPUTE_REFUND,
        fullyPaid: (context, event) => {
          const amount =
            event.type === 'PAYMENT RECEIVED' ? +event.transaction?.amount : 0;
          let total = +(amount * +(event.transaction?.rate || 0)).toFixed(0);

          // Check total payments with rates at time of transaction.
          const payouts = (context.ticket.ticketState.sale?.payments ||
            new Map<string, TransactionSummaryType[]>()) as Map<
            string,
            TransactionSummaryType[]
          >;
          total += calcTotal(payouts);

          return total >= context.ticket.price.amount;
        },
        showMissed: (context) => {
          return (
            context.ticket.ticketState.redemption === undefined ||
            context.ticket.ticketState.redemption?.redeemedAt === undefined
          );
        },
        fullyRefunded: (context, event) => {
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
        canWatchShow: (context) => {
          return (
            context.ticket.ticketState.status === TicketStatus.REDEEMED ||
            context.ticket.ticketState.status === TicketStatus.FULLY_PAID
          );
        },
        canBeRefunded: (context) => {
          const currency = context.ticket.price.currency;

          return (
            context.ticket.price.amount !== 0 &&
            (!context.ticket.ticketState.sale ||
              !context.ticket.ticketState.sale?.payments ||
              (context.ticket.ticketState.sale?.payments as any)[currency]
                ?.length === 0)
          );
        },

        noDisputeRefund: (context, event) => {
          const decision =
            context.ticket.ticketState.dispute?.decision || event.decision;
          if (!decision) return false;
          return decision === DisputeDecision.NO_REFUND;
        }
      }
    }
  );
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

  if (saveState)
    ticketService.onChange(async (context) => {
      if (context.ticket.save) await context.ticket.save();
    });

  return ticketService;
};

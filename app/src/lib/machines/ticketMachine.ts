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
  ticketDisputeSchema,
  ticketSaleSchema,
  transactionSummarySchema
} from '$lib/models/common';
import type { TicketDocument, TicketStateType } from '$lib/models/ticket';
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
  saveStateCallback?: (state: TicketStateType) => void;
  gracePeriod?: number;
  escrowPeriod?: number;
  showQueue?: Queue<ShowJobDataType, any, string>;
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
  ticketDocument,
  ticketMachineOptions
}: {
  ticketDocument: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
}) => {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAxAMoASA8gOoAEAogHIAiLHA2gAwBdRKAAOAe1io0Y0sJAAPRABYATABoQAT0QAOAIwA6AKx9TegGw6AzFYDsV83ysBfZxrRYcBYmTAGP2MgAMmL4EJAU-EJIIOKS0rIxiggqtoYq5kbmSnx69nxKOrYa2ikquca2Oip6AJzlVVXmru4Ygd4k5P5tOCFhETx60aISUqgycskqtemZ2bn5hcVaiCr6tQZOdrbmtUZWtTa2LSABXoSdfmfBoeEQkSrDsaMJk6v6BhlZOXlWBUUlVYqJS2So6JRGWq1TIqBwna4dXzdTw3fr3HhWJ5xMYTJKIP6zb4LP5LQEpHSZTY2JRKPR8Q7QlxuU49PAXJHXPp3SJKLEvcaJUBTcyE+a-f7LUo1IxGMEykzmKpKQ7w1mIrqc24DIx8+ICt4pIyin6LIrqFYpOkbIxVKx6JR2gr1VUo9VXVlcgbmXU4wUKVa0z5zE0ks1k+21PgGRV1EFWVQE5rMhHsjUerXo2w+154lJ2oNE8VLc2le006O2FRrKzlKuVlQu9qp90oz3onTZ-W5gkFsWmyWrGaGLaWPQ6I01vhJ1qu5vIwJtyK1Tu4oWrPTG4kSkuIPRWIwqCuw23-cfTlmznxp1sZyJ0ld+qYVL590OVsmpdJfGp6A9ZNaNucV4tgut6DEMcjYjma5lJuRZhhae61DoR42Hwtj7DatSAWywHzr0YF6I8kH8qu-oIHUcH9juZSylWcxFE4FKHOeKZ4QATnAYDsQAbhEtCMEwADCACCbBCSwQRBNwUQkXqZHJOY5QGLY9hLBK+gfuhKFKUaOjVLUyrWMcyZqnOnGwNxfH3AJzCieJknSbwEExFBXYwfuOhRl8qg6IZdSOOYH5KJYBh2kYNJ-BhgU4W6BgWVZkAGAA7vgYykFASgAAr4JoAC2YCkMgFD2RJUkiQAKgAknQbBMAASiwACKACqLBUBVMmCHJvoGvukYFr5-nQlOH6QoYlZ7rYfBGEU0JEbF5lcbxSWpelmU5flhXFVlIkAJq4OwFVMFVbBVdVlVdQ+BrQuYBjVExs1TaoRhjQ4KmzcCqiGV5M2LRxy3WQYZBjPgyCQJtBVFRQu0HUdDUsBJVUAGpXT10HkXuMrRoUJgHjNkKWGNfAobUaRGjNlYzXo-2XPFgNJSDaBgxDuVQzt+2HWwx2NUjqPOdduZY7K2TjjN5QytCOgfg4d3adM5T7ioJhMjOTYA5ZK0QPT6BgKg1mQ9tMOc-DvMsCjaOuaRj67lCGyGRF1iTuY+4y1YKHTGOIVKRumRKLTSIJVrOt6wbbNG7DXM84j5v84MgswRYqkqdCUKqC7vs0VWXn3UaGeRvYkImWrQF00HQOcbr+us1t0ONQAYi1nAI617Wdbw3VW-JNsUXbBgO4UNjlC7r2IbYMwGHk5TgjKIIWEYAddOXq1pWgGVKFQRBiMlFDVUJADSLDR1wLCHR3Cfkf13l+2sw2BR+5OT6kRRzzsNI6IvfjL9ra1r5lm-bwoA3JuHAW5tQ6pbEY3cDTAgwgYGk+xxyqTUqNRChwlD3WQi7bIwJxyf3pprIGv8yD-y3jvYBzdGqtwgQLdG7lL42mvhFW+tIRpBQtLCPI-csgbiNPYaw+x8Hf3pgAMwAK6kAgPVMAABHMRcBwb3AoaA0650qqXXPnQhS+I+DTBUn5dCysZjKyUOGQ4UZHY2DHKpA8sIhEMx-qvEhShpHiMkUAlgjdKExwtporuvVuyMMGiwgKqDSx+TuvGGUql7Tu2MvYwhK91ouLAG4pRniQEIz5jJFyUCAkeSrBgvYBJoQZBJuYdh4SIRhSrPGGkuxwRVHseEMABUbL0GYNJeuFVZL+IxskHILtoxrAdJkP42cPxeVBNYe01QqzAinAvUyl4y6QDAK0-iHSmAACk6CnUgc8aB3YoQ6TSLjXyJNagPw3GFVSXkxyiw3KrC86s6aFW5HvQ+x166nREkEKqAAtA5bltEUV2BghBNZdiVkMg4MkXkMH6TWH5G0ZpoT4PeYzUgLBYDoHYoA+uLBuAACERIHyybHYF1sDREQitGYpuiSY1BemSA41oHAQh2EpO0e5WJmTwpi7WZAcV4sARwKqVAsotU6idM6F1269Lyf0xAaRDBk0yDY8eThMisr8ipDI2Rfx2mBAtZZrykSCuBti3F+Kd6KsOfk8iqr+47BtBhLVDhR6lAnJPGsSClZlJpma0uFrJFYo4KgWAIgxHgxSk49eHAwDoEjQKCg4rJXSpYEwLgQkqpcD8Uq+hyQMJRgqTkewHLjx6DJIZCxFJcgOirGTI0GKw1CtIBGqNMa-DEITUmlNMg00SqlTKnNeackX2SFaD2qg8iGRpLCG04YCiyiNDaSEIU0iNFbXcK1nbo2xt7Zlfd3bXESPSV40BZtfH2pBT3e0sIcZTnjDMKcmQvWID2IYEK6EKkinpMXF5IauiWrypGyyEAAE73TSOrNqj5VUqOTBBUKlZ2KgKGkfSNhww1BQq6kUG504FFcMyUgYhwjwBiGxS4Wie4AFpKmIAY5sUwrG2NmGmkskuuE6aajRLRg0qhJn1H0Z6ssCzwQJMShAATuYbSHlUvGRiSxNJjycEeKcqlyjIScFJ4OR7srhyKrJmCVRZT1DJp5WlqQrBjQqdGCctKTk2C40BnjgcHFWtBoow2xm+lFt3HkFCD0Mjgk8vpMaB5+5hahJCccpruNxWEZXUONd2YmcxrYQo9LDhZclknLO7tDwkkLtkHYqQ9NEPjaQ7eGWph2mmf1JYdI-IhUixsHIJMZqMr2P7YN7ml6ec4mk6RciFGQDq+8ZUKdFT1HdvYd1Zi6W6JMJGCkfxcjYX60lzzBmz2SMmwgGsexjAXNpX8CkH7e4hRUhhd+NRcj2lc9RjzLS2mHbZQpm0NZZpFBrDsD8kYNgjNMOg-YEJ8HoHwKQXWAAbWHE3-OgoOFwlzSlqiEeQjLB00Z9wykXSSBs225wiLIPgWHqAABeiPC2grHCJqo1m5sYelohHIh5FQ1EszURwxHicCrbYdiEeG0PTTnlh2zFpxmfANcCaFeNdP87eW2q1IrbWHYihghWX6Cbgh1RaA8oJDIZDUk7cZO7w2RoPWAQ700OfzArTguw1aLTjisJsccUIst+VhH5C37aT2Huq0oRNybJBkTvQaawEKEXR9mrOyXpYpyk3qLCBtbK+uJbnJasggee3B7z-tmTSP705A2MayWafmLLvHvdTn00suLOmP7gwYHYAQag4dikKE-V7npA4eLV2KkoVmiKWEtIiKKhI84IAA */
      context: {
        ticketDocument,
        ticketMachineOptions,
        ticketState: JSON.parse(
          JSON.stringify(ticketDocument.ticketState)
        ) as TicketStateType,
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
          always: [
            {
              target: '#ticketMachine.reserved.waiting4Show',
              cond: 'isFreeTicket',
              actions: ['redeemFreeTicket']
            },
            {
              target: '#ticketMachine.reserved.waiting4Payment'
            }
          ],
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
              showId: context.ticketDocument.show.toString(),
              ticketId: context.ticketDocument._id.toString()
            }
          );
        },

        sendLeftShow: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.CUSTOMER_LEFT,
            {
              showId: context.ticketDocument.show.toString(),
              ticketId: context.ticketDocument._id.toString()
            }
          );
        },

        sendTicketSold: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_SOLD,
            {
              showId: context.ticketDocument.show.toString(),
              ticketId: context.ticketDocument._id.toString(),
              sale: context.ticketState.sale
            }
          );
        },

        sendTicketRedeemed: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_REDEEMED,
            {
              showId: context.ticketDocument.show.toString(),
              ticketId: context.ticketDocument._id.toString()
            }
          );
        },

        sendTicketRefunded: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_REFUNDED,
            {
              showId: context.ticketDocument.show.toString(),
              ticketId: context.ticketDocument._id.toString(),
              refund: context.ticketState.refund
            }
          );
        },

        sendTicketCancelled: (context, event) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_CANCELLED,
            {
              showId: context.ticketDocument.show.toString(),
              ticketId: context.ticketDocument._id.toString(),
              customerName: context.ticketDocument.user.name,
              cancel: event.cancel
            }
          );
        },

        sendTicketFinalized: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_FINALIZED,
            {
              showId: context.ticketDocument.show.toString(),
              ticketId: context.ticketDocument._id.toString()
            }
          );
        },

        sendDisputeInitiated: (context) => {
          ticketMachineOptions?.showQueue?.add(
            ShowMachineEventString.TICKET_DISPUTED,
            {
              showId: context.ticketDocument.show.toString(),
              ticketId: context.ticketDocument._id.toString(),
              dispute: context.ticketState.dispute
            }
          );
        },

        requestRefundCancelledShow: assign((context, event) => {
          const state = context.ticketState;
          const refund = refundSchema.parse({
            requestedAmounts: state.sale?.total,
            approvedAmounts: state.sale?.total,
            reason: RefundReason.SHOW_CANCELLED
          });
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.REFUND_REQUESTED,
              cancel: event.cancel,
              refund
            }
          };
        }),

        initiatePayment: assign((context, event) => {
          const paymentCurrency = event.paymentCurrency;
          const sale = ticketSaleSchema.parse({
            totals: {
              [paymentCurrency]: 0
            },
            payments: [],
            currency: paymentCurrency
          }) as SaleType;
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.PAYMENT_INITIATED,
              sale
            }
          };
        }),

        setFullyPaid: assign((context) => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.FULLY_PAID
            }
          };
        }),

        redeemTicket: assign((context) => {
          if (context.ticketState.status === TicketStatus.REDEEMED) return {};
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.REDEEMED,
              redemption: redemptionSchema.parse({})
            }
          };
        }),

        cancelTicket: assign((context) => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.CANCELLED
            }
          };
        }),

        receivePayment: assign((context, event) => {
          const sale = context.ticketState.sale;
          if (!sale) return {};
          const payment = transactionSummarySchema.parse({
            amount: +event.transaction.amount,
            currency: event.transaction.currency.toUpperCase() as CurrencyType,
            rate: +(event.transaction.rate || 0),
            transaction: event.transaction._id
          });
          sale.total += payment.amount;
          sale.payments.push(payment);

          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.PAYMENT_RECEIVED
            }
          };
        }),

        requestRefund: assign((context, event) => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.REFUND_REQUESTED,
              refund: event.refund
            }
          };
        }),

        initiateRefund: assign((context, event) => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.WAITING_FOR_REFUND,
              refund: event.refund
            }
          };
        }),

        receiveRefund: assign((context, event) => {
          const state = context.ticketState;
          const currency = event.transaction.currency.toUpperCase();
          const payout = transactionSummarySchema.parse({
            amount: +event.transaction.amount,
            currency,
            rate: +(event.transaction.rate || 0),
            transaction: event.transaction._id
          });
          const refund = state.refund;
          if (!refund) return {};

          refund.total += payout.amount;
          refund.payouts.push(payout);

          return {
            ticketState: {
              ...context.ticketState,
              refund
            }
          };
        }),

        receiveFeedback: assign((context, event) => {
          return {
            ticketState: {
              ...context.ticketState,
              feedback: event.feedback
            }
          };
        }),

        initiateDispute: assign((context, event) => {
          if (!context.ticketState.sale) return {};

          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.IN_DISPUTE,
              dispute: event.dispute,
              refund: event.refund
            }
          };
        }),

        endShow: assign((context) => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.IN_ESCROW,
              escrow: escrowSchema.parse({})
            }
          };
        }),

        finalizeTicket: assign((context, event) => {
          const finalize = event.finalize;
          if (context.ticketState.status !== TicketStatus.FINALIZED) {
            return {
              ticketState: {
                ...context.ticketState,
                finalize,
                status: TicketStatus.FINALIZED
              }
            };
          }
          return {};
        }),

        decideDispute: assign((context, event) => {
          const refund = event.refund;

          if (!context.ticketState.dispute) return {};
          const dispute = ticketDisputeSchema.parse({
            ...context.ticketState.dispute,
            decision: event.decision,
            endedAt: new Date(),
            resolved: true
          });
          return {
            ticketState: {
              ...context.ticketState,
              dispute,
              refund,
              status: TicketStatus.WAITING_FOR_DISPUTE_REFUND
            }
          };
        }),

        deactivateTicket: assign((context) => {
          return {
            ticketState: {
              ...context.ticketState,
              active: false
            }
          };
        }),

        missShow: assign((context) => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.MISSED_SHOW
            }
          };
        })
      },
      guards: {
        ticketCancelled: (context) =>
          context.ticketState.status === TicketStatus.CANCELLED,
        ticketFinalized: (context) =>
          context.ticketState.status === TicketStatus.FINALIZED,
        ticketInDispute: (context) =>
          context.ticketState.status === TicketStatus.IN_DISPUTE,
        ticketInEscrow: (context) =>
          context.ticketState.status === TicketStatus.IN_ESCROW,
        ticketReserved: (context) =>
          context.ticketState.status === TicketStatus.RESERVED,
        ticketRedeemed: (context) =>
          context.ticketState.status === TicketStatus.REDEEMED,
        ticketHasPaymentInitiated: (context) =>
          context.ticketState.status === TicketStatus.PAYMENT_INITIATED,
        ticketHasPayment: (context) =>
          context.ticketState.status === TicketStatus.PAYMENT_RECEIVED,
        ticketFullyPaid: (context) =>
          context.ticketState.status === TicketStatus.FULLY_PAID,
        ticketHasRefundRequested: (context) =>
          context.ticketState.status === TicketStatus.REFUND_REQUESTED,
        ticketIsWaitingForRefund: (context) =>
          context.ticketState.status === TicketStatus.WAITING_FOR_REFUND,
        ticketMissedShow: (context) =>
          context.ticketState.status === TicketStatus.MISSED_SHOW,
        ticketInDisputeRefund: (context) =>
          context.ticketState.status ===
          TicketStatus.WAITING_FOR_DISPUTE_REFUND,
        fullyPaid: (context, event) => {
          const amount =
            event.type === 'PAYMENT RECEIVED' ? +event.transaction?.amount : 0;
          let total = +(amount * +(event.transaction?.rate || 0)).toFixed(0);

          // Check total payments with rates at time of transaction.
          const payouts = (context.ticketState.sale?.payments ||
            new Map<string, TransactionSummaryType[]>()) as Map<
            string,
            TransactionSummaryType[]
          >;
          total += calcTotal(payouts);

          return total >= context.ticketDocument.price.amount;
        },
        showMissed: (context) => {
          return (
            context.ticketState.redemption === undefined ||
            context.ticketState.redemption?.redeemedAt === undefined
          );
        },
        fullyRefunded: (context, event) => {
          const refund = context.ticketState.refund;
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
            context.ticketState.status === TicketStatus.REDEEMED ||
            context.ticketState.status === TicketStatus.FULLY_PAID
          );
        },
        canBeRefunded: (context) => {
          const currency = context.ticketDocument.price.currency;

          return (
            context.ticketDocument.price.amount !== 0 &&
            (!context.ticketState.sale ||
              !context.ticketState.sale?.payments ||
              (context.ticketState.sale?.payments as any)[currency]?.length ===
                0)
          );
        },
        noDisputeRefund: (context, event) => {
          const decision =
            context.ticketState.dispute?.decision || event.decision;
          if (!decision) return false;
          return decision === DisputeDecision.NO_REFUND;
        },
        isFreeTicket: (context) => {
          return context.ticketDocument.price.amount === 0;
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
  ticketDocument,
  ticketMachineOptions
}: {
  ticketDocument: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
}) => {
  const ticketMachine = createTicketMachine({
    ticketDocument,
    ticketMachineOptions
  });
  const ticketService = interpret(ticketMachine).start();

  if (ticketMachineOptions?.saveStateCallback) {
    ticketService.onChange((context) => {
      ticketMachineOptions.saveStateCallback &&
        ticketMachineOptions.saveStateCallback(context.ticketState);
    });
  }

  return ticketService;
};

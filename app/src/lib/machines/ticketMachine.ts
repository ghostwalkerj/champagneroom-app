/* eslint-disable @typescript-eslint/naming-convention */

import type { Queue } from 'bullmq';
import { nanoid } from 'nanoid';
import { assign, createActor, raise, setup, type StateFrom } from 'xstate';

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
  /** @xstate-layout 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-IygwGVPUmQgM-NlzbI28qkTIg1Lz66nr7DMGk2xqhBWDGfIEIIn0hnWN8tw9pSBiAiPAWIp4pzxO1AAWkToRvsajSNkbPTLFUqI8MZlUM+Zp909J0peogk5yCpqsJoxBM9hg5R4T8oUSwaQO5vLxo9adNglAoXvBhdV-5UGrtSgXHKXHjUVEk7YFCWYViODATjSThgHqmBQusMc0D5RyfdkY7V1NfZLRU7U7tcEqxmgQbkn4077wDWyf2H8VLNi-ks7fazbCg15zs-7VTPazC8d0ekAUVZygdJxhCcMaNIxUjyCTILIyQt+sflPLBUWlhgmPZjQEyGPxlgGpsSoZ8nrn3sIUnLHG8scIiXwwRwjIDFdSBsJRQ6QySaQofTc1gKUVjBJJgooYsxBPloprdEBet0leFLEM+wNj4uofmNSAVNjnr8tS8FbHIXvVGeM5bjnXn7i6ts3tD0thPhxlSnmPiAHaJ6nNlrnR0D4FIIrAANoDnr12EmoR5qkn4ebUL2AAcLQELjTMglqKGekP3-DsLIPgQHqAABeoOu2vPKAObuoU8LFgBGYTJewbZOqep4gWk752E8NUmhAHwbbOGyJB3UY4oHPnqLzaBGWz35pZ263VrLesGcQu0gZ9R47WorG5KMOxJMC3aRLxdlb-q9eHApGVaR9iRkzcaWBBgssOzaVA+lGODBvrIOuqt+XTF1pDURED2oNg80BK07YphCQ7c3AHt8PccgM6hNrp3S6XeKed-9JbvWQxjhyaej80CPzQjHaYSozgoJITMHkJo9u30ftgF+n9vWGMZ2G2etCHxjSgO7qGeow4dgWjtG4IAA */
  return setup({
    types: {
      events: {} as TicketMachineEventType,
      context: {} as TicketMachineContextType
    },
    actions: {
      sendJoinedShow: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.CUSTOMER_JOINED,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString()
          }
        );
      },

      sendLeftShow: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.CUSTOMER_LEFT,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString()
          }
        );
      },

      sendTicketSold: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_SOLD,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString(),
            sale: params.ticket.ticketState.sale
          }
        );
      },

      sendTicketRedeemed: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_REDEEMED,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString()
          }
        );
      },

      sendTicketRefunded: (_, params: { ticket: TicketDocument }) => {
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
        params: { cancel: CancelType; ticket: TicketDocument }
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

      sendTicketFinalized: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add(
          ShowMachineEventString.TICKET_FINALIZED,
          {
            showId: params.ticket.show.toString(),
            ticketId: params.ticket._id.toString()
          }
        );
      },

      sendDisputeInitiated: (_, params: { ticket: TicketDocument }) => {
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
        params: { cancel: CancelType; ticket: TicketDocument }
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

      initiatePayment: (
        _,
        params: { ticket: TicketDocument; paymentCurrency: CurrencyType }
      ) => {
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

      setFullyPaid: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.FULLY_PAID;
          return { ticket };
        });
      },

      redeemTicket: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          if (ticket.ticketState.status === TicketStatus.REDEEMED)
            return { ticket };
          ticket.ticketState.status = TicketStatus.REDEEMED;
          ticket.ticketState.redemption = redemptionSchema.parse({});
          return { ticket };
        });
      },

      cancelTicket: (_, params: { ticket: TicketDocument }) => {
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

      initiateRefund: (
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

      receiveFeedback: (
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

      initiateDispute: (
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

      endShow: (_, params: { ticket: TicketDocument }) => {
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

      decideDispute: (
        _,
        params: {
          ticket: TicketDocument;
          decision: DisputeDecision;
          refund?: RefundType;
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
          if (refund) ticket.ticketState.refund = refund;
          ticket.ticketState.status = TicketStatus.WAITING_FOR_DISPUTE_REFUND;
          return { ticket };
        });
      },

      deactivateTicket: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.active = false;
          return { ticket };
        });
      },

      missShow: (_, params: { ticket: TicketDocument }) => {
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
      fullyPaid: (
        { context, event },
        params: { transaction: TransactionDocument }
      ) => {
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

      noDisputeRefund: ({ context }, params: { decision: DisputeDecision }) => {
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
            target: '#ticketMachine.reserved.ticketReserved',
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
        states: {
          waiting4Payment: {
            on: {
              'CANCELLATION REQUESTED': {
                target: '#ticketMachine.cancelled',
                actions: [
                  {
                    type: 'cancelTicket',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      cancel: event.cancel
                    })
                  },
                  {
                    type: 'sendTicketCancelled',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      cancel: event.cancel
                    })
                  }
                ]
              },
              'PAYMENT INITIATED': {
                target: '#ticketMachine.reserved.initiatedPayment',
                actions: [
                  {
                    type: 'initiatePayment',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      paymentCurrency: event.paymentCurrency
                    })
                  }
                ]
              }
            }
          },
          initiatedPayment: {
            on: {
              'PAYMENT RECEIVED': [
                {
                  target: '#ticketMachine.reserved.waiting4Show',
                  guard: {
                    type: 'fullyPaid',
                    params: ({ event }) => ({
                      transaction: event.transaction
                    })
                  },
                  actions: [
                    {
                      type: 'receivePayment',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    },
                    {
                      type: 'setFullyPaid',
                      params: ({ context }) => ({
                        ticket: context.ticket
                      })
                    },
                    {
                      type: 'sendTicketSold',
                      params: ({ context }) => ({
                        ticket: context.ticket
                      })
                    }
                  ]
                },
                {
                  target: '#ticketMachine.reserved.receivedPayment',
                  actions: [
                    {
                      type: 'receivePayment',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    }
                  ]
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
                  guard: {
                    type: 'fullyPaid',
                    params: ({ event }) => ({
                      transaction: event.transaction
                    })
                  },
                  actions: [
                    {
                      type: 'receivePayment',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    },
                    {
                      type: 'setFullyPaid',
                      params: ({ context }) => ({ ticket: context.ticket })
                    },
                    {
                      type: 'sendTicketSold',
                      params: ({ context }) => ({ ticket: context.ticket })
                    }
                  ]
                },
                {
                  actions: [
                    {
                      type: 'receivePayment',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    }
                  ]
                }
              ],
              'REFUND REQUESTED': {
                target: 'refundRequested',
                actions: [
                  {
                    type: 'requestRefund',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      refund: event.refund
                    })
                  }
                ]
              }
            }
          },
          waiting4Show: {
            on: {
              'TICKET REDEEMED': {
                target: '#ticketMachine.redeemed',
                guard: 'canWatchShow',
                actions: [
                  {
                    type: 'redeemTicket',
                    params: ({ context }) => ({
                      ticket: context.ticket
                    })
                  },
                  {
                    type: 'sendTicketRedeemed',
                    params: ({ context }) => ({
                      ticket: context.ticket
                    })
                  }
                ]
              },
              'REFUND REQUESTED': [
                {
                  target: 'refundRequested',
                  actions: [
                    {
                      type: 'requestRefund',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        refund: event.refund
                      })
                    }
                  ],
                  guard: 'canBeRefunded'
                },
                {
                  target: '#ticketMachine.cancelled',
                  actions: [
                    {
                      type: 'requestRefund',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        refund: event.refund
                      })
                    },
                    {
                      type: 'cancelTicket',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        refund: event.refund
                      })
                    },
                    {
                      type: 'sendTicketRefunded',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        refund: event.refund
                      })
                    }
                  ]
                }
              ]
            }
          },
          refundRequested: {
            on: {
              'REFUND INITIATED': {
                target: 'waiting4Refund',
                actions: [
                  {
                    type: 'initiateRefund',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      refund: event.refund
                    })
                  }
                ]
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
                    {
                      type: 'receiveRefund',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    },
                    {
                      type: 'cancelTicket',
                      params: ({ context }) => ({
                        ticket: context.ticket
                      })
                    },
                    {
                      type: 'sendTicketRefunded',
                      params: ({ context }) => ({
                        ticket: context.ticket
                      })
                    }
                  ]
                },
                {
                  actions: [
                    {
                      type: 'receiveRefund',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    }
                  ]
                }
              ]
            }
          }
        },
        on: {
          'SHOW CANCELLED': [
            {
              target: '#ticketMachine.reserved.refundRequested',
              actions: [
                {
                  type: 'requestRefundCancelledShow',
                  params: ({ context, event }) => ({
                    ticket: context.ticket,
                    cancel: event.cancel
                  })
                }
              ],
              guard: 'canBeRefunded'
            },
            {
              target: '#ticketMachine.cancelled',
              actions: [
                {
                  type: 'cancelTicket',
                  params: ({ context }) => ({
                    ticket: context.ticket
                  })
                },
                {
                  type: 'sendTicketCancelled',
                  params: ({ context, event }) => ({
                    ticket: context.ticket,
                    cancel: event.cancel
                  })
                }
              ]
            }
          ]
        }
      },
      redeemed: {
        on: {
          'SHOW LEFT': {
            actions: [
              {
                type: 'sendLeftShow',
                params: ({ context }) => ({
                  ticket: context.ticket
                })
              }
            ]
          },
          'SHOW JOINED': {
            guard: 'canWatchShow',
            actions: [
              {
                type: 'sendJoinedShow',
                params: ({ context }) => ({
                  ticket: context.ticket
                })
              }
            ]
          }
        }
      },
      cancelled: {
        type: 'final',
        entry: [
          {
            type: 'deactivateTicket',
            params: ({ context }) => ({
              ticket: context.ticket
            })
          }
        ]
      },
      finalized: {
        type: 'final',
        entry: [
          {
            type: 'deactivateTicket',
            params: ({ context }) => ({
              ticket: context.ticket
            })
          }
        ]
      },
      ended: {
        initial: 'inEscrow',
        on: {
          'TICKET FINALIZED': {
            target: '#ticketMachine.finalized',
            actions: [
              {
                type: 'finalizeTicket',
                params: ({ context, event }) => ({
                  ticket: context.ticket,
                  finalize: event.finalize
                })
              },
              {
                type: 'sendTicketFinalized',
                params: ({ context, event }) => ({
                  ticket: context.ticket,
                  finalize: event.finalize
                })
              }
            ]
          }
        },
        states: {
          inEscrow: {
            always: [
              {
                target: 'missedShow',
                guard: 'showMissed',
                actions: [
                  {
                    type: 'missShow',
                    params: ({ context }) => ({
                      ticket: context.ticket
                    })
                  }
                ]
              }
            ],
            on: {
              'FEEDBACK RECEIVED': {
                actions: [
                  {
                    type: 'receiveFeedback',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      feedback: event.feedback
                    })
                  },
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
                actions: [
                  {
                    type: 'initiateDispute',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      dispute: event.dispute,
                      refund: event.refund
                    })
                  },
                  {
                    type: 'sendDisputeInitiated',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      dispute: event.dispute
                    })
                  }
                ]
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
                        {
                          type: 'decideDispute',
                          params: ({ context, event }) => ({
                            ticket: context.ticket,
                            decision: event.decision,
                            refund: event.refund
                          })
                        },
                        raise({
                          type: 'TICKET FINALIZED',
                          finalize: finalizeSchema.parse({
                            finalizedBy: ActorType.ARBITRATOR
                          })
                        })
                      ],
                      guard: {
                        type: 'noDisputeRefund',
                        params: ({ event }) => ({
                          decision: event.decision
                        })
                      }
                    },
                    {
                      actions: [
                        {
                          type: 'decideDispute',
                          params: ({ context, event }) => ({
                            ticket: context.ticket,
                            decision: event.decision,
                            refund: event.refund
                          })
                        }
                      ],
                      target: 'waiting4DisputeRefund'
                    }
                  ]
                }
              },
              waiting4DisputeRefund: {
                on: {
                  'REFUND RECEIVED': {
                    actions: [
                      {
                        type: 'receiveRefund',
                        params: ({ context, event }) => ({
                          ticket: context.ticket,
                          transaction: event.transaction
                        })
                      },
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
                actions: [
                  {
                    type: 'initiateDispute',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      dispute: event.dispute,
                      refund: event.refund
                    })
                  },
                  {
                    type: 'sendDisputeInitiated',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      dispute: event.dispute
                    })
                  }
                ]
              }
            }
          }
        }
      }
    },
    on: {
      'SHOW ENDED': {
        target: '#ticketMachine.ended',
        actions: [
          {
            type: 'endShow',
            params: ({ context }) => ({
              ticket: context.ticket
            })
          }
        ]
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
  const ticketService = createActor(ticketMachine).start();
  const saveState = ticketMachineOptions?.saveState || true;

  if (saveState)
    ticketService.subscribe((state) => {
      if (state.context.ticket.save) state.context.ticket.save();
    });

  return ticketService;
};

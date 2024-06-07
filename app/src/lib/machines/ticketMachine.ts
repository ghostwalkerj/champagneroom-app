import type IORedis from 'ioredis';
import { nanoid } from 'nanoid';
import {
  type ActorRefFrom,
  assign,
  createActor,
  fromPromise,
  raise,
  sendTo,
  setup,
  spawnChild,
  stopChild
} from 'xstate';

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
import type { ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import type { TransactionDocument } from '$lib/models/transaction';

import type { CurrencyType } from '$lib/constants';
import {
  ActorType,
  DisputeDecision,
  RefundReason,
  TicketStatus
} from '$lib/constants';
import {
  type BitcartConfig as bcConfig,
  calcTotal,
  createTicketInvoice
} from '$lib/payments';

import {
  showMachine,
  type ShowMachineEventType,
  type ShowMachineInput,
  type ShowMachineOptions,
  type ShowMachineType
} from './showMachine';

type TicketMachineContext = {
  ticket: TicketDocument;
  show: ShowDocument;
  showMachineRef: ActorRefFrom<ShowMachineType>;
  redisConnection?: IORedis;
  options?: TicketMachineOptions;
  errorMessage: string | undefined;
  id: string;
};

//#region Event Types
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
      type: 'TICKET RESERVED';
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
    }
  | {
      type: 'SHOW UPDATED';
      show: ShowDocument;
    };

//endregion

export type TicketMachineInput = {
  ticket: TicketDocument;
  show: ShowDocument;
  redisConnection?: IORedis;
  options?: Partial<TicketMachineOptions>;
};

export type TicketMachineOptions = {
  saveState?: boolean;
  bcConfig?: bcConfig;
};

export type TicketMachineServiceType = ReturnType<
  typeof createTicketMachineService
>;

export type TicketMachineType = typeof ticketMachine;

export const createTicketMachineService = (input: TicketMachineInput) => {
  const ticketService = createActor(ticketMachine, {
    input
  }).start();

  if (input.options?.saveState)
    ticketService.subscribe((state) => {
      if (state.context.ticket.save) {
        state.context.ticket.save();
      }
    });

  return ticketService;
};

export const ticketMachine = setup({
  types: {
    events: {} as TicketMachineEventType,
    context: {} as TicketMachineContext,
    input: {} as TicketMachineInput
  },
  actors: {
    showMachine: {} as ShowMachineType,
    createInvoice: fromPromise(
      async ({
        input
      }: {
        input: {
          ticket: TicketDocument;
          bcConfig?: bcConfig;
        };
      }) => {
        const invoice = await createTicketInvoice({
          ticket: input.ticket,
          bcConfig: input.bcConfig
        });
        return invoice;
      }
    )
  },
  actions: {
    sendJoinedShow: (_: any, params: { ticket: TicketDocument }) => {
      sendTo('showMachine', {
        type: 'CUSTOMER JOINED',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    sendLeftShow: (_, params: { ticket: TicketDocument }) => {
      sendTo('showMachine', {
        type: 'CUSTOMER LEFT',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    sendTicketSold: (_, params: { ticket: TicketDocument }) => {
      sendTo('showMachine', {
        type: 'TICKET SOLD',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    sendTicketReserved: (_, params: { ticket: TicketDocument }) => {
      sendTo('showMachine', {
        type: 'TICKET RESERVED',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    sendTicketRedeemed: (_, params: { ticket: TicketDocument }) => {
      sendTo('showMachine', {
        type: 'TICKET REDEEMED',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    sendTicketRefunded: (_, params: { ticket: TicketDocument }) => {
      sendTo('showMachine', {
        type: 'TICKET REFUNDED',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    sendTicketCancelled: (
      _,
      params: { cancel: CancelType; ticket: TicketDocument }
    ) => {
      sendTo('showMachine', {
        type: 'TICKET CANCELLED',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    sendTicketFinalized: (_, params: { ticket: TicketDocument }) => {
      sendTo('showMachine', {
        type: 'TICKET FINALIZED',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    sendDisputeInitiated: (_, params: { ticket: TicketDocument }) => {
      sendTo('showMachine', {
        type: 'TICKET DISPUTED',
        ticket: params.ticket
      } as ShowMachineEventType);
    },

    updateShow: (
      _,
      params: {
        show: ShowDocument;
        redisConnection?: IORedis;
        options?: ShowMachineOptions;
      }
    ) => {
      stopChild('showMachine');
      assign({ childMachineRef: undefined });
      assign({
        show: params.show,
        showMachineRef: spawnChild(showMachine, {
          input: {
            show: params.show,
            redisConnection: params.redisConnection,
            options: params.options
          } as ShowMachineInput
        })
      });
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

    reserveTicket: (_, params: { ticket: TicketDocument }) => {
      assign(() => {
        const ticket = params.ticket;
        ticket.ticketState.status = TicketStatus.RESERVED;
        return { ticket };
      });
    },

    reserveFreeTicket: (_, params: { ticket: TicketDocument }) => {
      assign(() => {
        const ticket = params.ticket;
        ticket.ticketState.status = TicketStatus.RESERVED;
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

    receiveInvoice: (
      _,
      params: { ticket: TicketDocument; invoiceId: string | undefined }
    ) => {
      assign(() => {
        const ticket = params.ticket;
        ticket.bcInvoiceId = params.invoiceId;
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
    ticketCreated: ({ context }) =>
      context.ticket.ticketState.status === TicketStatus.CREATED,
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

      return totalRefundsAmount >= refundApproved;
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
    },
    isFreeTicket: ({ context }) => context.ticket.price.amount === 0
  }
}).createMachine({
  context: ({ input }) => ({
    ticket: input.ticket,
    show: input.show,
    showMachineRef: {} as ActorRefFrom<ShowMachineType>,
    errorMessage: undefined as string | undefined,
    id: nanoid(),
    redisConnection: input.redisConnection,
    options: {
      saveState: input.options?.saveState ?? false
    } as TicketMachineOptions
  }),
  id: 'ticketMachine',
  initial: 'ticketLoaded',
  exit: [stopChild('showMachine'), assign({ showMachineRef: undefined })],
  entry: [
    assign({
      showMachineRef: ({ spawn, context }) =>
        spawn(showMachine, {
          input: {
            show: context.show,
            redisConnection: context.redisConnection,
            options: {
              saveShowEvents: context.options?.saveState ?? false,
              saveState: context.options?.saveState ?? false
            }
          }
        })
    })
  ],
  states: {
    ticketLoaded: {
      always: [
        {
          target: 'ticketCreated',
          guard: 'ticketCreated'
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
    created: {
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
            }
          ]
        },
        'TICKET RESERVED': [
          {
            target: '#ticketMachine.reserved.waiting4Show',
            guard: 'isFreeTicket',
            actions: [
              {
                type: 'reserveFreeTicket',
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
            target: '#ticketMachine.reserved.waiting4Invoice',
            actions: [
              {
                type: 'reserveTicket',
                params: ({ context }) => ({
                  ticket: context.ticket
                })
              },
              {
                type: 'sendTicketReserved',
                params: ({ context }) => ({
                  ticket: context.ticket
                })
              }
            ]
          }
        ]
      }
    },
    reserved: {
      states: {
        waiting4Invoice: {
          invoke: {
            id: 'createInvoice',
            src: 'createInvoice',
            input: ({ context }) => ({
              ticket: context.ticket,
              bcConfig: context.options?.bcConfig
            }),
            onDone: {
              target: 'waiting4Payment',
              actions: [
                {
                  type: 'receiveInvoice',
                  params: ({ context, event }) => ({
                    ticket: context.ticket,
                    invoiceId: event.output.id
                  })
                }
              ]
            }
          }
        },
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
    'SHOW UPDATED': {
      actions: [
        {
          type: 'updateShow',
          params: ({ event }) => ({
            show: event.show
          })
        }
      ]
    },
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

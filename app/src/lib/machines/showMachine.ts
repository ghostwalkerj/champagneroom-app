/* eslint-disable @typescript-eslint/naming-convention */

import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { nanoid } from 'nanoid';
import {
  type AnyEventObject,
  assign,
  createActor,
  setup,
  type StateFrom
} from 'xstate';

import {
  type CancelType,
  escrowSchema,
  type FinalizeType,
  runtimeSchema
} from '$lib/models/common';
import type { ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import type { TransactionDocument } from '$lib/models/transaction';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { DisputeDecision, EntityType, ShowStatus } from '$lib/constants';

//#region Event Types
export type ShowMachineEventType =
  | {
      type: 'CANCELLATION INITIATED';
      cancel: CancelType;
    }
  | {
      type: 'TICKET FINALIZED';
      ticket: TicketDocument;
    }
  | {
      type: 'REFUND INITIATED';
    }
  | {
      type: 'TICKET REFUNDED';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET REDEEMED';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET RESERVED';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET CANCELLED';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET SOLD';
      ticket: TicketDocument;
    }
  | {
      type: 'SHOW STARTED';
    }
  | {
      type: 'SHOW STOPPED';
    }
  | {
      type: 'SHOW FINALIZED';
      finalize: FinalizeType;
    }
  | {
      type: 'SHOW ENDED';
    }
  | {
      type: 'CUSTOMER JOINED';
      ticket: TicketDocument;
    }
  | {
      type: 'CUSTOMER LEFT';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET DISPUTED';
      ticket: TicketDocument;
    }
  | {
      type: 'DISPUTE DECIDED';
      ticket: TicketDocument;
      decision: DisputeDecision;
    };

export type ShowMachineInput = {
  show: ShowDocument;
  redisConnection?: IORedis;
  options?: Partial<ShowMachineOptions>;
};

//endregion
export type ShowMachineOptions = {
  saveState: boolean;
  saveShowEvents: boolean;
  gracePeriod: number;
  escrowPeriod: number;
};

export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;

type ShowMachineContext = {
  show: ShowDocument;
  id: string;
  errorMessage?: string;
  options: ShowMachineOptions;
  showQueue: ShowQueueType | undefined;
};

export type ShowMachineStateType = StateFrom<typeof showMachine>;

const createShowEvent = (show: ShowDocument, event: AnyEventObject) => {
  if (event.type === 'xstate.stop') return;

  let ticketId: string | undefined;
  let customerName = 'someone';
  if ('ticket' in event) {
    const ticket = event.ticket as TicketDocument;
    ticketId = ticket._id.toString();
    customerName = ticket.user.name;
  } else if ('customerName' in event) {
    customerName = event.customerName as string;
  }
  const transaction = (
    'transaction' in event ? event.transaction : undefined
  ) as TransactionDocument | undefined;
  const ticketInfo = { customerName };
  show.saveShowEvent(event.type, ticketId, transaction, ticketInfo);
};

export type ShowMachineType = typeof showMachine;

export const createShowMachineService = (input: ShowMachineInput) => {
  const showService = createActor(showMachine, {
    input,
    inspect: (inspectionEvent) => {
      if (
        input.options?.saveShowEvents &&
        inspectionEvent.type === '@xstate.event'
      )
        createShowEvent(input.show, inspectionEvent.event);
    }
  }).start();

  if (input.options?.saveState)
    showService.subscribe((state) => {
      if (state.context.show.save) {
        state.context.show.save();
      }
    });

  return showService;
};
export const showMachine = setup({
  types: {
    events: {} as ShowMachineEventType,
    context: {} as ShowMachineContext,
    input: {} as ShowMachineInput
  },
  actions: {
    closeBoxOffice: (_, parameters: { show: ShowDocument }) =>
      assign(() => {
        const show = parameters.show;
        show.showState.status = ShowStatus.BOX_OFFICE_CLOSED;
        return {
          show
        };
      }),

    openBoxOffice: (_, parameters: { show: ShowDocument }) =>
      assign(() => {
        const show = parameters.show;
        show.showState.status = ShowStatus.BOX_OFFICE_OPEN;
        return {
          show
        };
      }),

    cancelShow: (_, parameters: { show: ShowDocument }) =>
      assign(() => {
        const show = parameters.show;
        show.showState.status = ShowStatus.CANCELLED;
        return {
          show
        };
      }),

    startShow: (_, parameters: { show: ShowDocument }) =>
      assign(() => {
        const show = parameters.show;
        show.showState.status = ShowStatus.LIVE;
        show.showState.runtime = runtimeSchema.parse({
          startDate: new Date()
        });
        return {
          show
        };
      }),

    endShow: (
      _,
      parameters: {
        show: ShowDocument;
        showQueue?: ShowQueueType;
      }
    ) => {
      assign(() => {
        const show = parameters.show;
        show.showState.status = ShowStatus.ENDED;
        show.showState.escrow = escrowSchema.parse({});
        show.showState.current = false;
        return {
          show
        };
      });
      if (parameters.showQueue) {
        parameters.showQueue.add('END SHOW', {
          showId: parameters.show._id.toString()
        });
      }
    },

    stopShow: (_, parameters: { show: ShowDocument }) =>
      assign(() => {
        const show = parameters.show;
        const startDate = show.showState.runtime?.startDate;
        if (!startDate) {
          throw new Error('Show start date is not defined');
        }
        show.showState.status = ShowStatus.STOPPED;
        show.showState.runtime = runtimeSchema.parse({
          startDate,
          endDate: new Date()
        });
        return { show };
      }),

    initiateCancellation: (
      _,
      parameters: {
        show: ShowDocument;
        cancel: CancelType;
        showQueue?: ShowQueueType;
      }
    ) => {
      assign(() => {
        const show = parameters.show;
        show.showState.status = ShowStatus.CANCELLATION_INITIATED;
        show.showState.cancel = parameters.cancel;
        show.showState.salesStats.ticketsAvailable = 0;
        return { show };
      });
      if (parameters.showQueue) {
        parameters.showQueue.add('CANCEL TICKETS', {
          showId: parameters.show._id.toString(),
          cancel: parameters.cancel
        });
      }
    },

    initiateRefund: (
      _,
      parameters: {
        show: ShowDocument;
        showQueue?: ShowQueueType;
      }
    ) => {
      assign(() => {
        const show = parameters.show;
        show.showState.status = ShowStatus.REFUND_INITIATED;
        return { show };
      });

      if (parameters.showQueue) {
        parameters.showQueue.add('REFUND TICKETS', {
          showId: parameters.show._id.toString()
        });
      }
    },

    receiveDispute: (
      _,
      parameters: {
        show: ShowDocument;
        ticket: TicketDocument;
      }
    ) =>
      assign(() => {
        const show = parameters.show;
        const ticket = parameters.ticket;
        show.showState.status = ShowStatus.ENDED;
        show.showState.disputes.push(ticket._id);
        show.$inc('showState.disputeStats.totalDisputes', 1);
        show.$inc('showState.disputeStats.totalDisputesPending', 1);
        return { show };
      }),

    receiveResolution: (
      _,
      parameters: {
        show: ShowDocument;
        decision: DisputeDecision;
      }
    ) =>
      assign(() => {
        const show = parameters.show;
        const refunded =
          parameters.decision === DisputeDecision.NO_REFUND ? 0 : 1;
        show.$inc('showState.disputeStats.totalDisputesPending', -1);
        show.$inc('showState.disputeStats.totalDisputesResolved', 1);
        show.$inc('showState.disputeStats.totalDisputesRefunded', refunded);
        return { show };
      }),

    refundTicket: (
      _,
      parameters: {
        show: ShowDocument;
        ticket: TicketDocument;
      }
    ) =>
      assign(() => {
        const show = parameters.show;
        show.$inc('showState.salesStats.ticketsRefunded', 1);
        show.$inc('showState.salesStats.ticketsSold', -1);
        show.$inc('showState.salesStats.ticketsAvailable', 1);
        show.showState.refunds.push(parameters.ticket._id);
        return { show };
      }),

    deactivateShow: (_, parameters: { show: ShowDocument }) =>
      assign(() => {
        const show = parameters.show;
        show.showState.active = false;
        show.showState.current = false;
        return { show };
      }),

    cancelTicket: (
      _,
      parameters: {
        show: ShowDocument;
        ticket: TicketDocument;
      }
    ) =>
      assign(() => {
        const show = parameters.show;
        show.showState.cancellations.push(parameters.ticket._id);
        show.$inc('showState.salesStats.ticketsAvailable', 1);
        show.$inc('showState.salesStats.ticketsReserved', -1);
        return { show };
      }),

    reserveTicket: (
      _,
      parameters: {
        show: ShowDocument;
        ticket: TicketDocument;
      }
    ) =>
      assign(() => {
        const show = parameters.show;
        show.showState.reservations.push(parameters.ticket._id);
        show.$inc('showState.salesStats.ticketsAvailable', -1);
        show.$inc('showState.salesStats.ticketsReserved', 1);
        return { show };
      }),

    redeemTicket: (
      _,
      parameters: {
        show: ShowDocument;
        ticket: TicketDocument;
      }
    ) =>
      assign(() => {
        const show = parameters.show;
        show.$inc('showState.salesStats.ticketsRedeemed', 1);
        show.showState.redemptions.push(parameters.ticket._id);
        return { show };
      }),

    finalizeTicket: (
      _,
      parameters: {
        show: ShowDocument;
        ticket: TicketDocument;
      }
    ) =>
      assign(() => {
        const show = parameters.show;
        show.$inc('showState.salesStats.ticketsFinalized', 1);
        show.showState.finalizations.push(parameters.ticket._id);
        return { show };
      }),

    sellTicket: (
      _,
      parameters: {
        show: ShowDocument;
        ticket: TicketDocument;
      }
    ) =>
      assign(() => {
        const show = parameters.show;
        show.$inc('showState.salesStats.ticketsSold', 1);
        show.$inc('showState.salesStats.ticketsReserved', -1);
        show.showState.sales.push(parameters.ticket._id);
        return { show };
      }),

    finalizeShow: (
      _,
      parameters: {
        show: ShowDocument;
        showQueue?: ShowQueueType;
      }
    ) => {
      const finalize = {
        finalizedAt: new Date()
      };
      assign(() => {
        const show = parameters.show;
        show.showState.status = ShowStatus.FINALIZED;
        show.showState.finalize = finalize;
        if (!show.showState.escrow)
          show.showState.escrow = escrowSchema.parse({
            startedAt: new Date()
          });
        show.showState.escrow.endedAt = new Date();
        return { show };
      });
      if (parameters.showQueue) {
        parameters.showQueue.add('CALCULATE STATS', {
          showId: parameters.show._id.toString()
        });
      }
    }
  },
  guards: {
    canCancel: (_, parameters: { show: ShowDocument }) => {
      const show = parameters.show;
      return (
        show.price.amount === 0 ||
        show.showState.salesStats.ticketsSold -
          show.showState.salesStats.ticketsRefunded ===
          0
      );
    },
    showCancelled: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.CANCELLED,
    showFinalized: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.FINALIZED,
    showInitiatedCancellation: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.CANCELLATION_INITIATED,
    showInitiatedRefund: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.REFUND_INITIATED,
    showBoxOfficeOpen: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.BOX_OFFICE_OPEN,
    showBoxOfficeClosed: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
    showStarted: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.LIVE,
    showStopped: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.STOPPED,
    showEnded: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.status === ShowStatus.ENDED,
    soldOut: (_, parameters: { show: ShowDocument }) =>
      parameters.show.showState.salesStats.ticketsAvailable === 1,
    canStartShow: (
      _,
      parameters: {
        show: ShowDocument;
        gracePeriod: number;
      }
    ) => {
      const st = parameters.show.showState;
      if (st.status === ShowStatus.STOPPED) {
        // Allow grace period to start show again
        if (!st.runtime!.startDate) {
          return false;
        }
        const startDate = new Date(st.runtime!.startDate);
        return (startDate.getTime() ?? 0) + parameters.gracePeriod > Date.now();
      }
      return st.salesStats.ticketsSold > 0;
    },
    fullyRefunded: (
      _,
      parameters: {
        show: ShowDocument;
        event: ShowMachineEventType;
      }
    ) => {
      const refunded = parameters.event.type === 'TICKET REFUNDED' ? 1 : 0;
      return parameters.show.showState.salesStats.ticketsSold - refunded === 0;
    },
    canFinalize: (
      _,
      parameters: {
        show: ShowDocument;
        escrowPeriod: number;
      }
    ) => {
      let startTime = 0;
      const show = parameters.show;
      const startedAt = show.showState.escrow?.startedAt;
      if (startedAt) {
        startTime = new Date(startedAt).getTime();
      }
      const hasUnfinalizedTickets =
        show.showState.salesStats.ticketsSold -
          show.showState.salesStats.ticketsFinalized >
        0;
      const escrowTime = 0 + parameters.escrowPeriod + startTime;
      const hasDisputes = show.showState.disputeStats.totalDisputesPending > 0;
      const escrowOver = escrowTime < Date.now();
      return escrowOver || (!hasDisputes && !hasUnfinalizedTickets);
    },
    disputesResolved: (
      _,
      parameters: {
        show: ShowDocument;
        event: ShowMachineEventType;
      }
    ) => {
      const resolved = parameters.event.type === 'DISPUTE DECIDED' ? 1 : 0;
      return (
        parameters.show.showState.disputeStats.totalDisputesPending -
          resolved ===
        0
      );
    }
  }
}).createMachine({
  context: ({ input }) => ({
    show: input.show,
    errorMessage: undefined as string | undefined,
    id: nanoid(),
    showQueue: input.redisConnection
      ? (new Queue(EntityType.SHOW, {
          connection: input.redisConnection
        }) as ShowQueueType)
      : undefined,
    options: {
      saveShowEvents: input.options?.saveShowEvents ?? false,
      saveState: input.options?.saveState ?? false,
      escrowPeriod: input.options?.escrowPeriod ?? 3_600_000,
      gracePeriod: input.options?.gracePeriod ?? 3_600_000
    } as ShowMachineOptions
  }),
  id: 'showMachine',
  initial: 'showLoaded',
  exit: ({ context }) => {
    if (context.showQueue) {
      context.showQueue.close();
    }
  },
  states: {
    showLoaded: {
      always: [
        {
          target: 'boxOfficeOpen',
          guard: {
            type: 'showBoxOfficeOpen',
            params: ({ context }) => ({ show: context.show })
          }
        },
        {
          target: 'boxOfficeClosed',
          guard: {
            type: 'showBoxOfficeClosed',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'initiatedCancellation',
          guard: {
            type: 'showInitiatedCancellation',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'initiatedCancellation.initiatedRefund',
          guard: {
            type: 'showInitiatedRefund',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'cancelled',
          guard: {
            type: 'showCancelled',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'finalized',
          guard: {
            type: 'showFinalized',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'started',
          guard: {
            type: 'showStarted',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'stopped',
          guard: {
            type: 'showStopped',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'ended',
          guard: {
            type: 'showEnded',
            params: ({ context }) => ({
              show: context.show
            })
          }
        }
      ]
    },
    cancelled: {
      type: 'final',
      entry: [
        {
          type: 'deactivateShow',
          params: ({ context }) => ({ show: context.show })
        }
      ]
    },
    ended: {
      always: {
        target: 'finalized',
        guard: {
          type: 'canFinalize',
          params: ({ context }) => ({
            show: context.show,
            escrowPeriod: context.options.escrowPeriod
          })
        },
        actions: [
          {
            type: 'finalizeShow',
            params: ({ context }) => ({
              show: context.show,
              showQueue: context.showQueue
            })
          }
        ]
      },
      on: {
        'TICKET FINALIZED': {
          actions: [
            {
              type: 'finalizeTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'TICKET DISPUTED': {
          actions: [
            {
              type: 'receiveDispute',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'DISPUTE DECIDED': [
          {
            actions: [
              {
                type: 'receiveResolution',
                params: ({ context, event }) => ({
                  show: context.show,
                  decision: event.decision
                })
              }
            ]
          }
        ]
      }
    },
    finalized: {
      type: 'final',
      entry: [
        {
          type: 'deactivateShow',
          params: ({ context }) => ({ show: context.show })
        }
      ]
    },
    boxOfficeOpen: {
      on: {
        'CANCELLATION INITIATED': [
          {
            target: 'cancelled',
            guard: {
              type: 'canCancel',
              params: ({ context }) => ({
                show: context.show
              })
            },
            actions: [
              {
                type: 'initiateCancellation',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel,
                  showQueue: context.showQueue
                })
              },
              {
                type: 'cancelShow',
                params: ({ context }) => ({
                  show: context.show
                })
              }
            ]
          },
          {
            target: 'initiatedCancellation',
            actions: [
              {
                type: 'initiateCancellation',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel
                })
              }
            ]
          }
        ],
        'TICKET RESERVED': [
          {
            target: 'boxOfficeClosed',
            guard: {
              type: 'soldOut',
              params: ({ context }) => ({
                show: context.show
              })
            },
            actions: [
              {
                type: 'reserveTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              },
              {
                type: 'closeBoxOffice',
                params: ({ context }) => ({
                  show: context.show
                })
              }
            ]
          },
          {
            actions: [
              {
                type: 'reserveTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ]
          }
        ],
        'TICKET CANCELLED': {
          actions: [
            {
              type: 'cancelTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'TICKET SOLD': {
          actions: [
            {
              type: 'sellTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'SHOW STARTED': {
          target: 'started',
          guard: {
            type: 'canStartShow',
            params: ({ context }) => ({
              show: context.show,
              gracePeriod: context.options.escrowPeriod
            })
          },
          actions: [
            {
              type: 'startShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        },
        'TICKET REFUNDED': [
          {
            actions: [
              {
                type: 'refundTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ]
          }
        ]
      }
    },
    boxOfficeClosed: {
      on: {
        'SHOW STARTED': {
          guard: {
            type: 'canStartShow',
            params: ({ context }) => ({
              show: context.show,
              gracePeriod: context.options.escrowPeriod
            })
          },
          target: 'started',
          actions: [
            {
              type: 'startShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        },
        'TICKET CANCELLED': [
          {
            target: 'boxOfficeOpen',
            actions: [
              {
                type: 'openBoxOffice',
                params: ({ context }) => ({
                  show: context.show
                })
              },
              {
                type: 'cancelTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ]
          }
        ],
        'TICKET SOLD': {
          actions: [
            {
              type: 'sellTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'TICKET REFUNDED': [
          {
            actions: [
              {
                type: 'openBoxOffice',
                params: ({ context }) => ({
                  show: context.show
                })
              },
              {
                type: 'refundTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ],
            target: 'boxOfficeOpen'
          }
        ],
        'CANCELLATION INITIATED': [
          {
            target: 'cancelled',
            guard: {
              type: 'canCancel',
              params: ({ context }) => ({ show: context.show })
            },
            actions: [
              {
                type: 'initiateCancellation',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel
                })
              },
              {
                type: 'cancelShow',
                params: ({ context }) => ({
                  show: context.show
                })
              }
            ]
          },
          {
            target: 'initiatedCancellation',
            actions: [
              {
                type: 'initiateCancellation',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel
                })
              }
            ]
          }
        ]
      }
    },
    started: {
      on: {
        'SHOW STARTED': {
          actions: [
            {
              type: 'startShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        },
        'TICKET REDEEMED': {
          actions: [
            {
              type: 'redeemTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'CUSTOMER JOINED': {},
        'CUSTOMER LEFT': {},
        'SHOW STOPPED': {
          target: 'stopped',
          actions: [
            {
              type: 'stopShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        }
      }
    },
    stopped: {
      on: {
        'SHOW STARTED': {
          target: 'started',
          actions: [
            {
              type: 'startShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ],
          guard: {
            type: 'canStartShow',
            params: ({ context }) => ({
              show: context.show,
              gracePeriod: context.options.escrowPeriod
            })
          }
        },
        'SHOW ENDED': {
          target: 'ended',
          actions: [
            {
              type: 'endShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        }
      }
    },
    initiatedCancellation: {
      initial: 'waiting2Refund',
      states: {
        waiting2Refund: {
          on: {
            'REFUND INITIATED': {
              target: 'initiatedRefund',
              actions: [
                {
                  type: 'initiateRefund',
                  params: ({ context }) => ({
                    show: context.show
                  })
                }
              ]
            }
          }
        },
        initiatedRefund: {
          on: {
            'TICKET REFUNDED': [
              {
                target: '#showMachine.cancelled',
                guard: {
                  type: 'fullyRefunded',
                  params: ({ context, event }) => ({
                    show: context.show,
                    event
                  })
                },
                actions: [
                  {
                    type: 'refundTicket',
                    params: ({ context, event }) => ({
                      show: context.show,
                      ticket: event.ticket
                    })
                  },
                  {
                    type: 'cancelShow',
                    params: ({ context }) => ({
                      show: context.show
                    })
                  }
                ]
              },
              {
                actions: [
                  {
                    type: 'refundTicket',
                    params: ({ context, event }) => ({
                      show: context.show,
                      ticket: event.ticket
                    })
                  }
                ]
              }
            ]
          }
        }
      }
    }
  }
});

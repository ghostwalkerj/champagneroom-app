/* eslint-disable @typescript-eslint/naming-convention */
import { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import { raise } from 'xstate/lib/actions';

import type {
  CancelType,
  DisputeType,
  FeedbackType,
  FinalizeType,
  RefundType,
  SaleType
} from '$lib/models/common';
import { DisputeDecision } from '$lib/models/common';
import type { ShowDocumentType } from '$lib/models/show';
import { ShowStatus } from '$lib/models/show';
import type { TransactionDocumentType } from '$lib/models/transaction';

import { ActorType } from '$lib/constants';

enum ShowMachineEventString {
  CANCELLATION_INITIATED = 'CANCELLATION INITIATED',
  REFUND_INITIATED = 'REFUND INITIATED',
  TICKET_REFUNDED = 'TICKET REFUNDED',
  TICKET_RESERVED = 'TICKET RESERVED',
  TICKET_RESERVATION_TIMEOUT = 'TICKET RESERVATION TIMEOUT',
  TICKET_CANCELLED = 'TICKET CANCELLED',
  TICKET_SOLD = 'TICKET SOLD',
  SHOW_STARTED = 'SHOW STARTED',
  SHOW_STOPPED = 'SHOW STOPPED',
  SHOW_FINALIZED = 'SHOW FINALIZED',
  SHOW_ENDED = 'SHOW ENDED',
  CUSTOMER_JOINED = 'CUSTOMER JOINED',
  CUSTOMER_LEFT = 'CUSTOMER LEFT',
  FEEDBACK_RECEIVED = 'FEEDBACK RECEIVED',
  ESCROW_ENDED = 'ESCROW ENDED',
  TICKET_DISPUTED = 'TICKET DISPUTED',
  DISPUTE_RESOLVED = 'DISPUTE RESOLVED',
  TICKET_REDEEMED = 'TICKET REDEEMED'
}

export { ShowMachineEventString };

export { createShowMachine };

export const createShowMachineService = ({
  showDocument,
  showMachineOptions
}: {
  showDocument: ShowDocumentType;
  showMachineOptions?: ShowMachineOptions;
}) => {
  const showMachine = createShowMachine({ showDocument, showMachineOptions });
  showMachine;
  const showService = interpret(showMachine).start();

  if (showMachineOptions?.saveStateCallback) {
    showService.onChange((context) => {
      showMachineOptions.saveStateCallback &&
        showMachineOptions.saveStateCallback(context.showState);
    });
  }

  if (showMachineOptions?.saveShowEventCallback) {
    showService.onEvent((event) => {
      const ticketId = ('ticketId' in event ? event.ticketId : undefined) as
        | string
        | undefined;
      const transaction = (
        'transaction' in event ? event.transaction : undefined
      ) as TransactionDocumentType | undefined;
      const ticketInfo = ('customerName' in event ? event : undefined) as
        | { customerName: string }
        | undefined;

      showMachineOptions.saveShowEventCallback &&
        showMachineOptions.saveShowEventCallback({
          type: event.type,
          ticketId,
          transaction,
          ticketInfo
        });
    });
  }

  return showService;
};

export type ShowMachineEventType =
  | {
      type: 'CANCELLATION INITIATED';
      cancel: CancelType;
    }
  | {
      type: 'FEEDBACK RECEIVED';
      ticket: FeedbackType;
    }
  | {
      type: 'REFUND INITIATED';
    }
  | {
      type: 'TICKET REFUNDED';
      refund: RefundType;
    }
  | {
      type: 'TICKET REDEEMED';
      ticketId: string;
    }
  | {
      type: 'TICKET RESERVED';
      ticketId: string;
      customerName: string;
    }
  | {
      type: 'TICKET RESERVATION TIMEOUT';
      ticketId: string;
    }
  | {
      type: 'TICKET CANCELLED';
      ticketId: string;
      customerName: string;
    }
  | {
      type: 'TICKET SOLD';
      ticketId: string;
      sale: SaleType;
      customerName: string;
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
      ticketId: string;
      customerName: string;
    }
  | {
      type: 'CUSTOMER LEFT';
      ticketId: string;
      customerName: string;
    }
  | {
      type: 'TICKET DISPUTED';
      dispute: DisputeType;
    }
  | {
      type: 'DISPUTE RESOLVED';
      decision: DisputeDecision;
    };

export type ShowMachineOptions = {
  saveStateCallback?: (state: ShowStateType) => void;
  saveShowEventCallback?: ({
    type,
    ticketId,
    transaction,
    ticketInfo
  }: {
    type: string;
    ticketId?: string;
    transaction?: TransactionDocumentType;
    ticketInfo?: { customerName: string };
  }) => void;
  gracePeriod?: number;
  escrowPeriod?: number;
};

export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;

const createShowMachine = ({
  showDocument,
  showMachineOptions
}: {
  showDocument: ShowDocumentType;
  showMachineOptions?: ShowMachineOptions;
}) => {
  const GRACE_PERIOD = showMachineOptions?.gracePeriod || 3_600_000;
  const ESCROW_PERIOD = showMachineOptions?.escrowPeriod || 3_600_000;

  /** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwBk0cJIBiAbQAYBdRUABzVkIBdCaYpxAAPRACYWADjIBOSQEYZAdnkAWFgDZt8pfNUAaEAE9EAVhlKyF+dtXrJMjVe0yAvh5OVs+IqQU6Bg0dIxMShxIIDx8gsKiEgjKcooq6lq6+oYm5ggyirYsAMwl2hYskhpKxUpePsG4BCTkvqH0EMySUdy8AkIi0UkGqSkZOnoGxmaISpKqRSwsSu4G2nOa9SC+TQGtwe3hxT0xffGDoMMyo+maE9nTedaLJcWOcxbatVs7-i1B1FoHWYGhOsX6CSGUhUCjGdyyU1ysxUFjIkgsFlqelcki+Fh+jT+gTaQPCFjBZwGiUskiRCGK1nkZA08gsyg0GlU2mqLgJmF2-xJYU6TG0FLiVKhyRhaTU8MmORmCCUnMkZFUsi0MgsrnkLFUxT5fmaxIOpJFqnFEIu4ikslht0yCseswsMI1LmUSjZBmcRoFpsBwuYMit52pCG0tKVxXKLHVrjmqlxKNU-qJ5BIAFFYHgAE6YBgAZQAEgB5ADqAAIAGIASQAcgBBKh1gBaWYAIqww5LLogowtuToNAVKvYqnTY+jbCirNIHCzDd5toSTZniDn84Wa1muwAhJsAYQA0lWAEpZo9ZusANS7PdE4PDUtUShsbNkUc+FUk8mKU6cjYshqH+ybVDq6brmQ2a5gWGAMLuB7Hmel7XneD6RE+lKQv2CDJmqHLzAyrLKOo8hTm8GhkHiFjqEsXJssuDT8hmZAAEZoGIZYAGY8YQeBgGWXBgMQDBHk2DbXlQVBNgAKnWZYNlWjZ1gp8kPuw2ESrhtr5NGeRVJ8ZAsPo7KSFUOiSFBewcVxvH8YJwmieJknSbJClKSpDZqXWGndlh0TPn2elKJUdLKG66qyMUf4yLGKxpiuvzQZx3F8QJQkiWJCmnlmckXlmRZZue97dlpQU4TaSQOKi+olKZ6KsqoMgGYgqgaGqmJxl8MiVN8yVrrZaUOZlzk5XWeUFZexWlZhva6Uk0hviZGh6Os-UOPFdLZGi5TuCOBiaPig2sal9kZU52UMLlJ75YVs23vJinKQpWBZmWACqcmPpVOnVXaLUKHR+rlAUVgUUqrVqtY6Kfv+COeKdxrDRdjlZS5t33RJUlZjJmkLQD0rvuqBpAUufXlHSybaGQxR2BopT-t1b42f8I2XRjE1TVWRZllQ5WExG7K01GcwsDq8gFLGGh0lGTJ6vLLKGPFlRs4EHPo+NxbltWRZyU255yQT2nWhGyYReRJmGG6mQstY2jq+QmtjddWPTVmNafQ2nYm39ZtSsouI0W+9jWMm8iaHSmLFMymJKAa8WKHRJ0sSj7No5lR4ADa8IwpaVrzBtG37vT-RGtUmRqTNNXRrV0jUJTqhiuLVLFOpqE7dnpejOd5507sPSVT2ea9dbvV9P0VWXAd4e4dXV41dh121+TlAonVciROjzl3LuCX3sCMIPOPuaXpzl1K89Vw1yfNfXSpS0yxQspUKrLLImJ75nB+50fA+TTugVPmAtfozxfHhFUegaLFBfiwaoeo3hcmpvYWwysVQ1DrtUb+Pcs5-2PoA+6l4vY+3PsFRaswORMncJ1JqfU-wASVBqeMpktoYjUBHJGacAzOx-mAQ+jBT54w8i9byvl-JgIvrPPSigIqwLVDQgoqg7COEcDg0av9+6uVxjJZ6XlVLqWNgFIWV9YoKBkA4Aw9NXgyAimtEySx+pzHmBiRQXdYD8BwHmfg+ddZF0NkYyR5CiZ9TkPMEoEE7iaCUBFNQNgWTKNqFYEcndkY8IoJ47xgjPr6zLO9c8VYABSZZGxkKqubVByx0T0wSesWWSpnDSAUDbbQ+oyat3cZknxnQjw5LknkkqVYqCeyniYvCfVUQVC-G+b0nJOqWw1MyG2pRtQRK+J0rx3SdaF1yQABV2WUy+eFPhMglmtMOljjoRWarYOinVZBhQZHUNJbEPFoC4CJToBc9bF0CdPKREC9InJMjqdaFjQ6uFiesMgYVN5LH-HKTp7zPnbOrFmUhgtTaAqSBbGMGJqJ-imOUVw9M6JdxIP0HA3Sjw4GIIJbO2cqUDDIBgHA-RiBQEkOeMAPEACuxBOjEO9p2MRhjDnSJqn1dU+0ORzIlgYCKCdCIvz1G6TQ1QWrkuIJS6ltL6WMvODBbVggqWQG5XygVN1CEexIb7TF-tsWzAsvE+OjhWoJP-IqqKHp6a6HlioLVOrIA0rpWABlTLhBGqDRAc1-KAE8yFRiiIYy9JqFRIoQwGDSXvkYYZWQCxpAuFqmBF+SUVzEDQPQeA0QUp7CxSFJIABabQdJm0OMcR2jtfoXnQSFB0etFCEDzKVO+eKRQ2RvlgcdNkXc8B6rDdnSAA6ibeisOqF+jMpa1BmRFFRtgbaM2xPFDqWqtzwWXRGWKwEWo1CliUdEKopx2CZCyCoa1rGM3il3fixAcDZ0IAALyXQ6htiBrCpEUBZAoBQmounpKopZTEVTxVKPTdRnNxoXqlLC050GtBvm5BOhulR4xvmuKZAwSwlzod7vgiAWG8KjjkE4FWegJbLEVE8KWDjUNsk0L6rhq4zq2Q8Zs4D4DQNDpVHTKWa1rAqDeNcephlDBqlZDoaGmbU5CfTsSfgyLxMAskxY5jYV7DpDsH+FtMZ3yokwZLTUdFrI9tshSk1urQ3hsBcEiMa1qKlCAiRyyDCG6RyZB6RmbwrCci-S5-4bnCCmogCG-VEbiAsrZYIDlXKeVxoY0CuYdN4FviC1oP8irWQKHfGtVx74-yBvc8G+dXnmUJaS7GgV+WkiaDkPtZwFjaidSloq64NF1jrHdVGWMXgvBAA */
  return createMachine(
    {
      context: {
        showDocument,
        showState: JSON.parse(
          JSON.stringify(showDocument.showState)
        ) as ShowStateType,
        errorMessage: undefined as string | undefined,
        id: nanoid()
      },
      tsTypes: {} as import('./showMachine.typegen').Typegen0,
      schema: {
        events: {} as ShowMachineEventType
      },
      predictableActionArguments: true,
      id: 'showMachine',
      initial: 'showLoaded',

      states: {
        showLoaded: {
          always: [
            {
              target: 'boxOfficeOpen',
              cond: 'showBoxOfficeOpen'
            },
            {
              target: 'boxOfficeClosed',
              cond: 'showBoxOfficeClosed'
            },
            {
              target: 'initiatedCancellation',
              cond: 'showInitiatedCancellation'
            },
            {
              target: 'initiatedCancellation.initiatedRefund',
              cond: 'showInitiatedRefund'
            },
            {
              target: 'cancelled',
              cond: 'showCancelled'
            },
            {
              target: 'finalized',
              cond: 'showFinalized'
            },
            {
              target: 'started',
              cond: 'showStarted'
            },
            {
              target: 'stopped',
              cond: 'showStopped'
            },
            {
              target: 'ended.inEscrow',
              cond: 'showInEscrow'
            },
            { target: 'ended.inDispute', cond: 'showInDispute' }
          ]
        },
        cancelled: {
          type: 'final',
          entry: ['deactivateShow']
        },
        ended: {
          initial: 'inEscrow',
          on: {
            'SHOW FINALIZED': {
              target: 'finalized',
              actions: ['finalizeShow']
            },
            'FEEDBACK RECEIVED': [
              {
                actions: [
                  raise({
                    type: 'SHOW FINALIZED',
                    finalize: {
                      finalizedAt: new Date(),
                      finalizedBy: ActorType.CUSTOMER
                    }
                  })
                ],
                cond: 'canFinalize'
              }
            ],
            'TICKET DISPUTED': {
              target: 'ended.inDispute',
              actions: ['receiveDispute']
            }
          },
          states: {
            inEscrow: {},
            inDispute: {
              on: {
                'DISPUTE RESOLVED': [
                  {
                    actions: [
                      'receiveResolution',
                      raise({
                        type: 'SHOW FINALIZED',
                        finalize: {
                          finalizedAt: new Date(),
                          finalizedBy: ActorType.ARBITRATOR
                        }
                      })
                    ],
                    cond: 'canFinalize'
                  },
                  {
                    actions: ['receiveResolution'],
                    target: 'inEscrow',
                    cond: 'disputesResolved'
                  },
                  {
                    actions: ['receiveResolution']
                  }
                ]
              }
            }
          }
        },
        finalized: {
          type: 'final',
          entry: ['deactivateShow']
        },
        boxOfficeOpen: {
          on: {
            'CANCELLATION INITIATED': [
              {
                target: 'cancelled',
                cond: 'canCancel',
                actions: ['initiateCancellation', 'cancelShow']
              },
              {
                target: 'initiatedCancellation',
                actions: ['initiateCancellation']
              }
            ],
            'TICKET RESERVED': [
              {
                target: 'boxOfficeClosed',
                cond: 'soldOut',
                actions: ['reserveTicket', 'closeBoxOffice']
              },
              {
                actions: ['reserveTicket']
              }
            ],
            'TICKET RESERVATION TIMEOUT': {
              actions: ['timeoutReservation']
            },
            'TICKET CANCELLED': {
              actions: ['cancelTicket']
            },
            'TICKET SOLD': {
              actions: ['sellTicket']
            },
            'SHOW STARTED': {
              target: 'started',
              cond: 'canStartShow',
              actions: ['startShow']
            },
            'TICKET REFUNDED': [
              {
                actions: ['refundTicket']
              }
            ]
          }
        },
        boxOfficeClosed: {
          on: {
            'SHOW STARTED': {
              cond: 'canStartShow',
              target: 'started',
              actions: ['startShow']
            },
            'TICKET RESERVATION TIMEOUT': [
              {
                target: 'boxOfficeOpen',
                actions: ['openBoxOffice', 'timeoutReservation']
              }
            ],
            'TICKET CANCELLED': [
              {
                target: 'boxOfficeOpen',
                actions: ['openBoxOffice', 'cancelTicket']
              }
            ],
            'TICKET SOLD': {
              actions: ['sellTicket']
            },
            'TICKET REFUNDED': [
              {
                actions: ['refundTicket']
              }
            ],
            'CANCELLATION INITIATED': [
              {
                target: 'cancelled',
                cond: 'canCancel',
                actions: ['initiateCancellation', 'cancelShow']
              },
              {
                target: 'initiatedCancellation',
                actions: ['initiateCancellation']
              }
            ]
          }
        },
        started: {
          on: {
            'SHOW STARTED': {
              actions: ['startShow']
            },
            'TICKET REDEEMED': {
              actions: ['redeemTicket']
            },
            'CUSTOMER JOINED': {},
            'CUSTOMER LEFT': {},
            'SHOW STOPPED': {
              target: 'stopped',
              actions: ['stopShow']
            }
          }
        },
        stopped: {
          on: {
            'SHOW STARTED': {
              target: 'started',
              actions: ['startShow'],
              cond: 'canStartShow'
            },
            'SHOW ENDED': {
              target: 'ended.inEscrow',
              actions: ['endShow']
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
                  actions: ['initiateRefund']
                }
              }
            },
            initiatedRefund: {
              on: {
                'TICKET REFUNDED': [
                  {
                    target: '#showMachine.cancelled',
                    cond: 'fullyRefunded',
                    actions: ['refundTicket', 'cancelShow']
                  },
                  {
                    actions: ['refundTicket']
                  }
                ]
              }
            }
          }
        }
      }
    },
    {
      actions: {
        closeBoxOffice: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.BOX_OFFICE_CLOSED
            }
          };
        }),

        openBoxOffice: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.BOX_OFFICE_OPEN
            }
          };
        }),

        cancelShow: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.CANCELLED
            }
          };
        }),

        startShow: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.LIVE,
              runtime: {
                startDate: new Date(),
                endDate: undefined
              }
            }
          };
        }),

        endShow: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.IN_ESCROW,
              escrow: {
                startedAt: new Date()
              },
              current: false
            }
          };
        }),

        stopShow: assign((context) => {
          const startDate = context.showState.runtime?.startDate;
          if (!startDate) {
            throw new Error('Show start date is not defined');
          }

          return {
            showState: {
              ...context.showState,
              status: ShowStatus.STOPPED,
              runtime: {
                startDate,
                endDate: new Date()
              }
            }
          };
        }),

        initiateCancellation: assign((context, event) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.CANCELLATION_INITIATED,
              salesStats: {
                ...context.showState.salesStats,
                ticketsAvailable: 0
              },
              cancel: event.cancel
            }
          };
        }),

        initiateRefund: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.REFUND_INITIATED
            }
          };
        }),

        receiveDispute: assign((context, event) => {
          console.log('receiveDispute', event);
          const st = context.showState;
          return {
            showState: {
              ...st,
              status: ShowStatus.IN_DISPUTE,
              disputes: [...st.disputes, event.dispute._id!],
              disputeStats: {
                ...st.disputeStats,
                totalDisputes: st.disputeStats.totalDisputes + 1,
                totalDisputesPending: st.disputeStats.totalDisputesPending + 1
              }
            }
          };
        }),

        receiveResolution: assign((context, event) => {
          const st = context.showState;
          const refunded = event.decision === DisputeDecision.NO_REFUND ? 0 : 1;
          return {
            showState: {
              ...st,
              disputeStats: {
                ...st.disputeStats,
                totalDisputesPending: st.disputeStats.totalDisputesPending - 1,
                totalDisputesResolved:
                  st.disputeStats.totalDisputesResolved + 1,
                totalDisputesRefunded:
                  st.disputeStats.totalDisputesRefunded + refunded
              }
            }
          };
        }),

        refundTicket: assign((context, event) => {
          const st = context.showState;
          const refund = event.refund;

          const ticketsRefunded = st.salesStats.ticketsRefunded + 1;
          const ticketsSold = st.salesStats.ticketsSold - 1;
          const totalRefunded = st.salesStats.totalRefunded + refund.amount;
          const totalRevenue = st.salesStats.totalRevenue - refund.amount;
          st.refunds.push(refund._id!);

          return {
            showState: {
              ...st,
              salesStats: {
                ...st.salesStats,
                ticketsRefunded,
                totalRefunded,
                ticketsSold,
                totalRevenue
              }
            }
          };
        }),

        deactivateShow: assign((context) => {
          return {
            showState: {
              ...context.showState,
              activeState: false,
              current: false
            }
          };
        }),

        cancelTicket: assign((context, event) => {
          const st = context.showState;
          st.cancellations.push(new Types.ObjectId(event.ticketId));
          return {
            showState: {
              ...st,
              salesStats: {
                ...st.salesStats,
                ticketsAvailable: st.salesStats.ticketsAvailable + 1,
                ticketsReserved: st.salesStats.ticketsReserved - 1
              }
            }
          };
        }),

        reserveTicket: assign((context, event) => {
          const st = context.showState;
          st.reservations.push(new Types.ObjectId(event.ticketId));
          return {
            showState: {
              ...st,
              salesStats: {
                ...st.salesStats,
                ticketsAvailable: st.salesStats.ticketsAvailable - 1,
                ticketsReserved: st.salesStats.ticketsReserved + 1
              }
            }
          };
        }),

        redeemTicket: assign((context, event) => {
          const st = context.showState;
          st.redemptions.push(new Types.ObjectId(event.ticketId));
          return {
            showState: {
              ...st
            }
          };
        }),

        timeoutReservation: assign((context, event) => {
          const st = context.showState;
          const index = st.reservations.indexOf(
            new Types.ObjectId(event.ticketId)
          );
          if (index > -1) {
            st.reservations.splice(index, 1);
          }
          return {
            showState: {
              ...st,
              salesStats: {
                ...st.salesStats,
                ticketsAvailable: st.salesStats.ticketsAvailable + 1,
                ticketsReserved: st.salesStats.ticketsReserved - 1
              }
            }
          };
        }),

        sellTicket: assign((context, event) => {
          const st = context.showState;
          const sale = event.sale;
          const ticketsSold = st.salesStats.ticketsSold + 1;
          const ticketsReserved = st.salesStats.ticketsReserved - 1;
          const totalSales = st.salesStats.totalSales + sale.amount;
          const totalRevenue = st.salesStats.totalRevenue + sale.amount;
          st.sales.push(sale._id!);
          return {
            showState: {
              ...st,
              salesStats: {
                ...st.salesStats,
                ticketsSold,
                totalSales,
                ticketsReserved,
                totalRevenue
              }
            }
          };
        }),

        finalizeShow: assign((context, event) => {
          const escrow = context.showState.escrow || {
            startedAt: new Date()
          };
          return {
            showState: {
              ...context.showState,
              escrow: {
                ...escrow,
                endedAt: new Date()
              },
              status: ShowStatus.FINALIZED,
              finalized: event.finalize
            }
          };
        })
      },

      guards: {
        canCancel: (context) =>
          context.showState.salesStats.ticketsSold -
            context.showState.salesStats.ticketsRefunded ===
          0,
        showCancelled: (context) =>
          context.showState.status === ShowStatus.CANCELLED,
        showFinalized: (context) =>
          context.showState.status === ShowStatus.FINALIZED,
        showInitiatedCancellation: (context) =>
          context.showState.status === ShowStatus.CANCELLATION_INITIATED,
        showInitiatedRefund: (context) =>
          context.showState.status === ShowStatus.REFUND_INITIATED,
        showBoxOfficeOpen: (context) =>
          context.showState.status === ShowStatus.BOX_OFFICE_OPEN,
        showBoxOfficeClosed: (context) =>
          context.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
        showStarted: (context) => context.showState.status === ShowStatus.LIVE,
        showStopped: (context) =>
          context.showState.status === ShowStatus.STOPPED,
        showInEscrow: (context) =>
          context.showState.status === ShowStatus.IN_ESCROW,
        showInDispute: (context) =>
          context.showState.status === ShowStatus.IN_DISPUTE,
        soldOut: (context) =>
          context.showState.salesStats.ticketsAvailable === 1,
        canStartShow: (context) => {
          if (context.showState.status === ShowStatus.STOPPED) {
            // Allow grace period to start show again
            if (!context.showState.runtime!.startDate) {
              return false;
            }
            const startDate = new Date(context.showState.runtime!.startDate);
            return (startDate.getTime() ?? 0) + +GRACE_PERIOD > Date.now();
          }
          return context.showState.salesStats.ticketsSold > 0;
        },
        fullyRefunded: (context, event) => {
          const refunded = event.type === 'TICKET REFUNDED' ? 1 : 0;
          return context.showState.salesStats.ticketsSold - refunded === 0;
        },
        canFinalize: (context, event) => {
          const escrowStartDate = context.showState.escrow?.startedAt;
          const escrowStartTime = escrowStartDate?.getTime() ?? 0;
          console.log('escrowStartTime', escrowStartTime);
          const count = event.type === 'FEEDBACK RECEIVED' ? 1 : 0;
          const fullyReviewed =
            context.showState.feedbackStats.numberOfReviews + count ===
            context.showState.salesStats.ticketsSold;
          const hasDisputes =
            context.showState.disputeStats.totalDisputesPending > 0;
          const escrowOver = escrowStartTime + GRACE_PERIOD < Date.now();
          return escrowOver || (fullyReviewed && !hasDisputes);
        },
        disputesResolved: (context) =>
          context.showState.disputeStats.totalDisputesPending === 0
      }
    }
  );
};

export type ShowMachineStateType = StateFrom<typeof createShowMachine>;
export type ShowMachineType = ReturnType<typeof createShowMachine>;
export type ShowStateType = ShowDocumentType['showState'];

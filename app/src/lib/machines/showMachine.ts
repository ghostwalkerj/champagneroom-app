/* eslint-disable @typescript-eslint/naming-convention */

import { nanoid } from 'nanoid';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import { raise } from 'xstate/lib/actions';

import {
  type CancelType,
  escrowSchema,
  finalizeSchema,
  type FinalizeType,
  runtimeSchema
} from '$lib/models/common';
import type { ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import type { TransactionDocument } from '$lib/models/transaction';

import { ActorType, DisputeDecision, ShowStatus } from '$lib/constants';

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

export type ShowMachineOptions = {
  saveState?: boolean;
  saveShowEvents?: boolean;
  gracePeriod?: number;
  escrowPeriod?: number;
};

export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;

export type ShowMachineStateType = StateFrom<typeof createShowMachine>;

export type ShowMachineType = ReturnType<typeof createShowMachine>;

export type ShowStateType = ShowDocument['showState'];

const createShowMachine = ({
  show,
  showMachineOptions
}: {
  show: ShowDocument;
  showMachineOptions?: ShowMachineOptions;
}) => {
  const GRACE_PERIOD = showMachineOptions?.gracePeriod || 3_600_000;
  const ESCROW_PERIOD = showMachineOptions?.escrowPeriod || 3_600_000;

  /** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwBk0cJIBiAbQAYBdRUABzVkIBdCaYpxAAPRACYWADjIBOSQEYZAdnkAWFgDZt8pfNUAaEAE9EAVhlKyF+dtXrJMjVe0yAvh5OVs+IqQU6Bg0dIxMShxIIDx8gsKiEgjKcooq6lq6+oYm5ggyirYsAMwl2hYskhpKxUpePsG4BCTkvqH0EMySUdy8AkIi0UkGqSkZOnoGxmaISpKqRSwsSu4G2nOa9SC+TQGtwe3hxT0xffGDoMMyo+maE9nTedaLJcWOcxbatVs7-i1B1FoHWYGhOsX6CSGUhUCjGdyyU1ysxUFjIkgsFlqelcki+Fh+jT+gTaQPCFjBZwGiUskiRCGK1nkZA08gsyg0GlU2mqLgJmF2-xJYU6TG0FLiVKhyRhaTU8MmORmCCUnMkZFUsi0MgsrnkLFUxT5fmaxIOpJFqnFEIu4ikslht0yCseswsMI1LmUSjZBmcRoFpsBwuYMit52pCG0tKVxXKLHVrjmqlxKNU-qJ5BIAFFYHgAE6YBgAZQAEgB5ADqAAIAGIASQAcgBBKh1gBaWYAIqww5LLogowtuToNAVKvYqnTY+jbCirNIHCzDd5toSTZniDn84Wa1muwAhJsAYQA0lWAEpZo9ZusANS7PdE4PDUtUShsbNkUc+FUk8mKU6cjYshqH+ybVDq6brmQ2a5gWGAMLuB7Hmel7XneD6RE+lKQv2CDJmqHLzAyrLKOo8hTm8GhkHiFjqEsXJssuDT8hmZAAEZoGIZYAGY8YQeBgGWXBgMQDBHk2DbXlQVBNgAKnWZYNlWjZ1gp8kPuw2ESrhtr5NGeRVJ8ZAsPo7KSFUOiSFBewcVxvH8YJwmieJknSbJClKSpDZqXWGndlh0TPn2elKJUdLKG66qyMUf4yLGKxpiuvzQZx3F8QJQkiWJCmnlmckXlmRZZue97dlpQU4TaSQOKi+olKZ6KsqoMgGYgqgaGqmJxl8MiVN8yVrrZaUOZlzk5XWeUFZexWlZhva6Uk0hviZGh6Os-UOPFdLZGi5TuCOBiaPig2sal9kZU52UMLlJ75YVs23vJinKQpWBZmWACqcmPpVOnVXaLUKHR+rlAUVgUUqrVqtY6Kfv+COeKdxrDRdjlZS5t33RJUlZjJmkLQD0rvuqBpAUufXlHSybaGQxR2BopT-t1b42f8I2XRjE1TVWRZllQ5WExG7K01GcwsDq8gFLGGh0lGTJ6vLLKGPFlRs4EHPo+NxbltWRZyU255yQT2nWhGyYReRJmGG6mQstY2jq+QmtjddWPTVmNafQ2nYm39ZtSsouI0W+9jWMm8iaHSmLFMymJKAa8WKHRJ0sSj7No5lR4ADa8IwpaVrzBtG37vT-RGtUmRqTNNXRrV0jUJTqhiuLVLFOpqE7dnpejOd5507sPSVT2ea9dbvV9P0VWXAd4e4dXV41dh121+TlAonVciROjzl3LuCX3sCMIPOPuaXpzl1K89Vw1yfNfXSpS0yxQspUKrLLImJ75nB+50fA+TTugVPmAtfozxfHhFUegaLFBfiwaoeo3hcmpvYWwysVQ1DrtUb+Pcs5-2PoA+6l4vY+3PsFRaswORMncJ1JqfU-wASVBqeMpktoYjUBHJGacAzOx-mAQ+jBT54w8i9byvl-JgIvrPPSigIqwLVDQgoqg7COEcDg0av9+6uVxjJZ6XlVLqWNgFIWV9YoKBkA4Aw9NXgyAimtEySx+pzHmBiRQXdYD8BwHmfg+ddZF0NkYyR5CiZ9TkPMEoEE7iaCUBFNQNgWTKNqFYEcndkY8IoJ47xgjPr6zLO9c8VYABSZZGxkKqubVByx0T0wSesWWSpnDSAUDbbQ+oyat3cZknxnQjw5LknkkqVYqCeyniYvCfVUQVC-G+b0nJOqWw1MyG2pRtQRK+J0rx3SdaF1yQABV2WUy+eFPhMglmtMOljjoRWarYOinVZBhQZHUNJbEPFoC4CJToBc9bF0CdPKREC9InJMjqdaFjQ6uFiesMgYVN5LH-HKTp7zPnbOrFmUhgtTaAqSBbGMGJqJ-imOUVw9M6JdxIP0HA3Sjw4GIIJbO2cqUDDIBgHA-RiBQEkOeMAPEACuxBOjEO9p2MRhjDnSJqn1dU+0ORzIlgYCKCdCIvz1G6TQ1QWrkuIJS6ltL6WMvODBbVggqWQG5XygVN1CEexIb7TF-tsWzAsvE+OjhWoJP-IqqKHp6a6HlioLVOrIA0rpWABlTLhBGqDRAc1-KAE8yFRiiIYy9JqFRIoQwGDSXvkYYZWQCxpAuFqmBF+SUVzEDQPQeA0QUp7CxSFJIABabQdJm0OMcR2jtfoXnQSFB0etFCEDzKVO+eKRQ2RvlgcdNkXc8B6rDdnSAA6ibeisOqF+jMpa1BmRFFRtgbaM2xPFDqWqtzwWXRGWKwEWo1CliUdEKopx2CZCyCoa1rGM3il3fixAcDZ0IAALyXQ6htiBrCpEUBZAoBQmounpKopZTEVTxVKPTdRnNxoXqlLC050GtBvm5BOhulR4xvmuKZAwSwlzod7vgiAWG8KjjkE4FWegJbLEVE8KWDjUNsk0L6rhq4zq2Q8Zs4D4DQNDpVHTKWa1rAqDeNcephlDBqlZDoaGmbU5CfTsSfgyLxMAskxY5jYV7DpDsH+FtMZ3yokwZLTUdFrI9tshSk1urQ3hsBcEiMa1qKlCAiRyyDCG6RyZB6RmbwrCci-S5-4bnCCmogCG-VEbiAsrZYIDlXKeVxoY0CuYdN4FviC1oP8irWQKHfGtVx74-yBvc8G+dXnmUJaS7GgV+WkiaDkPtZwFjaidSloq64NF1jrHdVGWMXgvBAA */
  return createMachine(
    {
      context: {
        show,
        errorMessage: undefined as string | undefined,
        id: nanoid()
      } as {
        show: ShowDocument;
        errorMessage: string | undefined;
        id: string;
      },
      tsTypes: {} as import('./showMachine.typegen.d.ts').Typegen0,
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
            'TICKET FINALIZED': {
              actions: ['finalizeTicket']
            },
            'TICKET DISPUTED': {
              target: 'ended.inDispute',
              actions: ['receiveDispute']
            }
          },
          states: {
            inEscrow: {
              on: {
                'SHOW FINALIZED': {
                  target: '#showMachine.finalized',
                  actions: ['finalizeShow'],
                  cond: 'canFinalize'
                }
              }
            },
            inDispute: {
              on: {
                'DISPUTE DECIDED': [
                  {
                    actions: [
                      'receiveResolution',
                      raise({
                        type: 'SHOW FINALIZED',
                        finalize: finalizeSchema.parse({
                          finalizedBy: ActorType.ARBITRATOR
                        })
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
                actions: ['openBoxOffice', 'refundTicket'],
                target: 'boxOfficeOpen'
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
          const show = context.show;
          show.showState.status = ShowStatus.BOX_OFFICE_CLOSED;
          return {
            show
          };
        }),

        openBoxOffice: assign((context) => {
          const show = context.show;
          show.showState.status = ShowStatus.BOX_OFFICE_OPEN;
          return {
            show
          };
        }),

        cancelShow: assign((context) => {
          const show = context.show;
          show.showState.status = ShowStatus.CANCELLED;
          return {
            show
          };
        }),

        startShow: assign((context) => {
          const show = context.show;
          show.showState.status = ShowStatus.LIVE;
          show.showState.runtime = runtimeSchema.parse({
            startDate: new Date()
          });
          return {
            show
          };
        }),

        endShow: assign((context) => {
          const show = context.show;
          show.showState.status = ShowStatus.IN_ESCROW;
          show.showState.escrow = escrowSchema.parse({});
          show.showState.current = false;
          return {
            show
          };
        }),

        stopShow: assign((context) => {
          const show = context.show;
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

        initiateCancellation: assign((context, event) => {
          const show = context.show;
          show.showState.status = ShowStatus.CANCELLATION_INITIATED;
          show.showState.cancel = event.cancel;
          show.showState.salesStats.ticketsAvailable = 0;
          return { show };
        }),

        initiateRefund: assign((context) => {
          const show = context.show;
          show.showState.status = ShowStatus.REFUND_INITIATED;
          return { show };
        }),

        receiveDispute: assign((context, event) => {
          const show = context.show;
          show.showState.status = ShowStatus.IN_DISPUTE;
          show.showState.disputes.push(event.ticket._id);
          show.$inc('showState.disputeStats.totalDisputes', 1);
          show.$inc('showState.disputeStats.totalDisputesPending', 1);
          return { show };
        }),

        receiveResolution: assign((context, event) => {
          const show = context.show;
          const refunded = event.decision === DisputeDecision.NO_REFUND ? 0 : 1;
          show.$inc('showState.disputeStats.totalDisputesPending', -1);
          show.$inc('showState.disputeStats.totalDisputesResolved', 1);
          show.$inc('showState.disputeStats.totalDisputesRefunded', refunded);
          return { show };
        }),

        refundTicket: assign((context, event) => {
          const show = context.show;
          show.$inc('showState.salesStats.ticketsRefunded', 1);
          show.$inc('showState.salesStats.ticketsSold', -1);
          show.$inc('showState.salesStats.ticketsAvailable', 1);
          show.showState.refunds.push(event.ticket._id);
          return { show };
        }),

        deactivateShow: assign((context) => {
          const show = context.show;
          show.showState.active = false;
          show.showState.current = false;
          return { show };
        }),

        cancelTicket: assign((context, event) => {
          const show = context.show;
          show.showState.cancellations.push(event.ticket._id);
          show.$inc('showState.salesStats.ticketsAvailable', 1);
          show.$inc('showState.salesStats.ticketsReserved', -1);
          return { show };
        }),

        reserveTicket: assign((context, event) => {
          const show = context.show;
          show.showState.reservations.push(event.ticket._id);
          show.$inc('showState.salesStats.ticketsAvailable', -1);
          show.$inc('showState.salesStats.ticketsReserved', 1);
          return { show };
        }),

        redeemTicket: assign((context, event) => {
          const show = context.show;
          show.$inc('showState.salesStats.ticketsRedeemed', 1);
          show.showState.redemptions.push(event.ticket._id);
          return { show };
        }),

        finalizeTicket: assign((context, event) => {
          const show = context.show;
          show.$inc('showState.salesStats.ticketsFinalized', 1);
          show.showState.finalizations.push(event.ticket._id);
          return { show };
        }),

        sellTicket: assign((context, event) => {
          const show = context.show;
          show.$inc('showState.salesStats.ticketsSold', 1);
          show.$inc('showState.salesStats.ticketsReserved', -1);
          show.showState.sales.push(event.ticket._id);
          return { show };
        }),

        finalizeShow: assign((context, event) => {
          const show = context.show;
          show.showState.status = ShowStatus.FINALIZED;
          show.showState.finalize = event.finalize;
          if (!show.showState.escrow)
            show.showState.escrow = escrowSchema.parse({
              startedAt: new Date()
            });
          show.showState.escrow.endedAt = new Date();

          return { show };
        })
      },

      guards: {
        canCancel: (context) =>
          context.show.price.amount === 0 ||
          context.show.showState.salesStats.ticketsSold -
            context.show.showState.salesStats.ticketsRefunded ===
            0,
        showCancelled: (context) =>
          context.show.showState.status === ShowStatus.CANCELLED,
        showFinalized: (context) =>
          context.show.showState.status === ShowStatus.FINALIZED,
        showInitiatedCancellation: (context) =>
          context.show.showState.status === ShowStatus.CANCELLATION_INITIATED,
        showInitiatedRefund: (context) =>
          context.show.showState.status === ShowStatus.REFUND_INITIATED,
        showBoxOfficeOpen: (context) =>
          context.show.showState.status === ShowStatus.BOX_OFFICE_OPEN,
        showBoxOfficeClosed: (context) =>
          context.show.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
        showStarted: (context) =>
          context.show.showState.status === ShowStatus.LIVE,
        showStopped: (context) =>
          context.show.showState.status === ShowStatus.STOPPED,
        showInEscrow: (context) =>
          context.show.showState.status === ShowStatus.IN_ESCROW,
        showInDispute: (context) =>
          context.show.showState.status === ShowStatus.IN_DISPUTE,
        soldOut: (context) =>
          context.show.showState.salesStats.ticketsAvailable === 1,
        canStartShow: (context) => {
          if (context.show.showState.status === ShowStatus.STOPPED) {
            // Allow grace period to start show again
            if (!context.show.showState.runtime!.startDate) {
              return false;
            }
            const startDate = new Date(
              context.show.showState.runtime!.startDate
            );
            return (startDate.getTime() ?? 0) + +GRACE_PERIOD > Date.now();
          }
          return context.show.showState.salesStats.ticketsSold > 0;
        },
        fullyRefunded: (context, event) => {
          const refunded = event.type === 'TICKET REFUNDED' ? 1 : 0;
          return context.show.showState.salesStats.ticketsSold - refunded === 0;
        },
        canFinalize: (context) => {
          let startTime = 0;
          const startedAt = context.show.showState.escrow?.startedAt;
          if (startedAt) {
            startTime = new Date(startedAt).getTime();
          }
          const hasUnfinalizedTickets =
            context.show.showState.salesStats.ticketsSold -
              context.show.showState.salesStats.ticketsFinalized >
            0;
          const escrowTime = 0 + ESCROW_PERIOD + startTime;
          const hasDisputes =
            context.show.showState.disputeStats.totalDisputesPending > 0;
          const escrowOver = escrowTime < Date.now();
          return escrowOver || (!hasDisputes && !hasUnfinalizedTickets);
        },
        disputesResolved: (context, event) => {
          const resolved = event.type === 'DISPUTE DECIDED' ? 1 : 0;
          return (
            context.show.showState.disputeStats.totalDisputesPending -
              resolved ===
            0
          );
        }
      }
    }
  );
};

export { createShowMachine };
export const createShowMachineService = ({
  show,
  showMachineOptions
}: {
  show: ShowDocument;
  showMachineOptions?: ShowMachineOptions;
}) => {
  const showMachine = createShowMachine({ show, showMachineOptions });
  showMachine;
  const showService = interpret(showMachine).start();
  const saveState = showMachineOptions?.saveState ?? true;
  const saveShowEvents = showMachineOptions?.saveShowEvents ?? true;

  if (saveState) {
    showService.onChange(async (context) => {
      if (context.show.save) await context.show.save();
    });
  }

  if (saveShowEvents) {
    showService.onEvent((event) => {
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
    });
  }
  return showService;
};

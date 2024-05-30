/* eslint-disable @typescript-eslint/naming-convention */

import { nanoid } from 'nanoid';
import {
  type AnyEventObject,
  assign,
  createActor,
  raise,
  setup,
  type StateFrom
} from 'xstate';

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

export type ShowMachineEventString = ShowMachineEventType['type'];

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
  return setup({
    types: {
      events: {} as ShowMachineEventType,
      context: {} as {
        show: ShowDocument;
        errorMessage: string | undefined;
        id: string;
      }
    },
    actions: {
      closeBoxOffice: (_, params: { show: ShowDocument }) =>
        assign(() => {
          const show = params.show;
          show.showState.status = ShowStatus.BOX_OFFICE_CLOSED;
          return {
            show
          };
        }),

      openBoxOffice: (_, params: { show: ShowDocument }) =>
        assign(() => {
          const show = params.show;
          show.showState.status = ShowStatus.BOX_OFFICE_OPEN;
          return {
            show
          };
        }),

      cancelShow: (_, params: { show: ShowDocument }) =>
        assign(() => {
          const show = params.show;
          show.showState.status = ShowStatus.CANCELLED;
          return {
            show
          };
        }),

      startShow: (_, params: { show: ShowDocument }) =>
        assign(() => {
          const show = params.show;
          show.showState.status = ShowStatus.LIVE;
          show.showState.runtime = runtimeSchema.parse({
            startDate: new Date()
          });
          return {
            show
          };
        }),

      endShow: (_, params: { show: ShowDocument }) =>
        assign(() => {
          const show = params.show;
          show.showState.status = ShowStatus.IN_ESCROW;
          show.showState.escrow = escrowSchema.parse({});
          show.showState.current = false;
          return {
            show
          };
        }),

      stopShow: (_, params: { show: ShowDocument }) =>
        assign(() => {
          const show = params.show;
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
        params: {
          show: ShowDocument;
          cancel: CancelType;
        }
      ) =>
        assign(() => {
          const show = params.show;
          show.showState.status = ShowStatus.CANCELLATION_INITIATED;
          show.showState.cancel = params.cancel;
          show.showState.salesStats.ticketsAvailable = 0;
          return { show };
        }),

      initiateRefund: (_, params: { show: ShowDocument }) =>
        assign(() => {
          const show = params.show;
          show.showState.status = ShowStatus.REFUND_INITIATED;
          return { show };
        }),

      receiveDispute: (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) =>
        assign(() => {
          const show = params.show;
          const ticket = params.ticket;
          show.showState.status = ShowStatus.IN_DISPUTE;
          show.showState.disputes.push(ticket._id);
          show.$inc('showState.disputeStats.totalDisputes', 1);
          show.$inc('showState.disputeStats.totalDisputesPending', 1);
          return { show };
        }),

      receiveResolution: (
        _,
        params: {
          show: ShowDocument;
          decision: DisputeDecision;
        }
      ) =>
        assign(() => {
          const show = params.show;
          const refunded =
            params.decision === DisputeDecision.NO_REFUND ? 0 : 1;
          show.$inc('showState.disputeStats.totalDisputesPending', -1);
          show.$inc('showState.disputeStats.totalDisputesResolved', 1);
          show.$inc('showState.disputeStats.totalDisputesRefunded', refunded);
          return { show };
        }),

      refundTicket: (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) =>
        assign(() => {
          show.$inc('showState.salesStats.ticketsRefunded', 1);
          show.$inc('showState.salesStats.ticketsSold', -1);
          show.$inc('showState.salesStats.ticketsAvailable', 1);
          show.showState.refunds.push(params.ticket._id);
          return { show };
        }),

      deactivateShow: (_, params: { show: ShowDocument }) =>
        assign(() => {
          const show = params.show;
          show.showState.active = false;
          show.showState.current = false;
          return { show };
        }),

      cancelTicket: (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) =>
        assign(() => {
          show.showState.cancellations.push(params.ticket._id);
          show.$inc('showState.salesStats.ticketsAvailable', 1);
          show.$inc('showState.salesStats.ticketsReserved', -1);
          return { show };
        }),

      reserveTicket: (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) =>
        assign(() => {
          const show = params.show;
          show.showState.reservations.push(params.ticket._id);
          show.$inc('showState.salesStats.ticketsAvailable', -1);
          show.$inc('showState.salesStats.ticketsReserved', 1);
          return { show };
        }),

      redeemTicket: (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) =>
        assign(() => {
          const show = params.show;
          show.$inc('showState.salesStats.ticketsRedeemed', 1);
          show.showState.redemptions.push(params.ticket._id);
          return { show };
        }),

      finalizeTicket: (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) =>
        assign(() => {
          const show = params.show;
          show.$inc('showState.salesStats.ticketsFinalized', 1);
          show.showState.finalizations.push(params.ticket._id);
          return { show };
        }),

      sellTicket: (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) =>
        assign(() => {
          const show = params.show;
          show.$inc('showState.salesStats.ticketsSold', 1);
          show.$inc('showState.salesStats.ticketsReserved', -1);
          show.showState.sales.push(params.ticket._id);
          return { show };
        }),

      finalizeShow: (
        _,
        params: {
          show: ShowDocument;
          finalize: FinalizeType;
        }
      ) =>
        assign(() => {
          const show = params.show;
          show.showState.status = ShowStatus.FINALIZED;
          show.showState.finalize = params.finalize;
          if (!show.showState.escrow)
            show.showState.escrow = escrowSchema.parse({
              startedAt: new Date()
            });
          show.showState.escrow.endedAt = new Date();

          return { show };
        })
    },
    guards: {
      canCancel: (_, params: { show: ShowDocument }) => {
        const show = params.show;
        return (
          show.price.amount === 0 ||
          show.showState.salesStats.ticketsSold -
            show.showState.salesStats.ticketsRefunded ===
            0
        );
      },
      showCancelled: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.CANCELLED,
      showFinalized: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.FINALIZED,
      showInitiatedCancellation: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.CANCELLATION_INITIATED,
      showInitiatedRefund: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.REFUND_INITIATED,
      showBoxOfficeOpen: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.BOX_OFFICE_OPEN,
      showBoxOfficeClosed: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
      showStarted: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.LIVE,
      showStopped: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.STOPPED,
      showInEscrow: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.IN_ESCROW,
      showInDispute: (_, params: { show: ShowDocument }) =>
        params.show.showState.status === ShowStatus.IN_DISPUTE,
      soldOut: (_, params: { show: ShowDocument }) =>
        params.show.showState.salesStats.ticketsAvailable === 1,
      canStartShow: (_, params: { show: ShowDocument }) => {
        if (params.show.showState.status === ShowStatus.STOPPED) {
          // Allow grace period to start show again
          if (!params.show.showState.runtime!.startDate) {
            return false;
          }
          const startDate = new Date(params.show.showState.runtime!.startDate);
          return (startDate.getTime() ?? 0) + +GRACE_PERIOD > Date.now();
        }
        return params.show.showState.salesStats.ticketsSold > 0;
      },
      fullyRefunded: (
        _,
        params: {
          show: ShowDocument;
          event: ShowMachineEventType;
        }
      ) => {
        const refunded = params.event.type === 'TICKET REFUNDED' ? 1 : 0;
        return params.show.showState.salesStats.ticketsSold - refunded === 0;
      },
      canFinalize: (_, params: { show: ShowDocument }) => {
        let startTime = 0;
        const show = params.show;
        const startedAt = show.showState.escrow?.startedAt;
        if (startedAt) {
          startTime = new Date(startedAt).getTime();
        }
        const hasUnfinalizedTickets =
          show.showState.salesStats.ticketsSold -
            show.showState.salesStats.ticketsFinalized >
          0;
        const escrowTime = 0 + ESCROW_PERIOD + startTime;
        const hasDisputes =
          show.showState.disputeStats.totalDisputesPending > 0;
        const escrowOver = escrowTime < Date.now();
        return escrowOver || (!hasDisputes && !hasUnfinalizedTickets);
      },
      disputesResolved: (
        _,
        params: {
          show: ShowDocument;
          event: ShowMachineEventType;
        }
      ) => {
        const resolved = params.event.type === 'DISPUTE DECIDED' ? 1 : 0;
        return (
          params.show.showState.disputeStats.totalDisputesPending - resolved ===
          0
        );
      }
    }
  }).createMachine({
    context: {
      show,
      errorMessage: undefined as string | undefined,
      id: nanoid()
    } as {
      show: ShowDocument;
      errorMessage: string | undefined;
      id: string;
    },
    id: 'showMachine',
    initial: 'showLoaded',
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
            target: 'ended.inEscrow',
            guard: {
              type: 'showInEscrow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          },
          {
            target: 'ended.inDispute',

            guard: {
              type: 'showInDispute',
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
        initial: 'inEscrow',
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
            target: 'ended.inDispute',
            actions: [
              {
                type: 'receiveDispute',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ]
          }
        },
        states: {
          inEscrow: {
            on: {
              'SHOW FINALIZED': {
                target: '#showMachine.finalized',
                actions: [
                  {
                    type: 'finalizeShow',
                    params: ({ context, event }) => ({
                      show: context.show,
                      finalize: event.finalize
                    })
                  }
                ],
                guard: {
                  type: 'canFinalize',
                  params: ({ context }) => ({
                    show: context.show
                  })
                }
              }
            }
          },
          inDispute: {
            on: {
              'DISPUTE DECIDED': [
                {
                  actions: [
                    {
                      type: 'receiveResolution',
                      params: ({ context, event }) => ({
                        show: context.show,
                        decision: event.decision
                      })
                    },
                    raise({
                      type: 'SHOW FINALIZED',
                      finalize: finalizeSchema.parse({
                        finalizedBy: ActorType.ARBITRATOR
                      })
                    })
                  ],
                  guard: {
                    type: 'canFinalize',
                    params: ({ context }) => ({
                      show: context.show
                    })
                  }
                },
                {
                  actions: [
                    {
                      type: 'receiveResolution',
                      params: ({ context, event }) => ({
                        show: context.show,
                        decision: event.decision
                      })
                    }
                  ],
                  target: 'inEscrow',
                  guard: {
                    type: 'disputesResolved',
                    params: ({ context, event }) => ({
                      show: context.show,
                      event
                    })
                  }
                },
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
          }
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
                show: context.show
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
                show: context.show
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
                show: context.show
              })
            }
          },
          'SHOW ENDED': {
            target: 'ended.inEscrow',
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
};

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

export { createShowMachine };
export const createShowMachineService = ({
  show,
  showMachineOptions
}: {
  show: ShowDocument;
  showMachineOptions?: ShowMachineOptions;
}) => {
  const showMachine = createShowMachine({ show, showMachineOptions });
  const showService = createActor(showMachine, {
    inspect: (inspectionEvent) => {
      if (inspectionEvent.type === '@xstate.event')
        createShowEvent(show, inspectionEvent.event);
    }
  }).start();
  const saveState = showMachineOptions?.saveState ?? true;

  if (saveState)
    showService.subscribe((state) => {
      if (saveState && state.context.show.save) {
        state.context.show.save();
      }
    });

  return showService;
};

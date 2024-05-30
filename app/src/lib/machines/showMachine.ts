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

  /** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwBk0cJIBiAbQAYBdRUABzVkIBdCaYpxAAPRACYAjAA4ysgJzKAbAFZpLAMyK5AFkkAaEAE9EstYrIrFKyYr06WitZLUBfd8crZ8RUhToGDR0jEzSHEggPHyCwqISCJKS8kqqGtq6sgbGZgjS0pJaZAVqKiyuspJ6tlqe3kG4BCTkPiH0EMySkdy8AkIiUYmSLKnKthk6+kamUpIA7GQs8-Nqznoskirl87L1ID5N-q1B7WFaPdF9cYOgidKKY+maU9kzeXKSZPPSa5ojOj0Ki0Hi8B0afhagWotA6zD0lxi-XiQzmTwmLyyOVm+T0mgUo1kWiK82JZRU+0OkICbVhYTUiOuAwSiFcuUQWmkNRKzhYD3KnLUxMpEOaNNOdM6TBUjNizNRSTkCnG6kx03Z+SJ8i0RPmKj0QM52xFmCOUNpoSl81lyNu4iko2Vz0y6pxD2y1g2bmk8xY2ge0hNvjFJxhluYshtNxZCHm7ykenmeiWm2yP2cijqYKpIehwUlzEUUfld0Q7qdGJdbw1Iwsnu0id0hV+oIapup5DAxDhABUAJIAYQA0gBRHsAAgAYn2AHIAQSofYAWiOACKsYso0sIWSFJZaPQaKqrPEWGuPYpJ7RqP56zbzINmgJd3uD0cT1d9gDKAAUAKo9muG6iEi0YKloWgsEsazaACmayCsNYWIsNgNkCMjzI8eiPh2ZAvpAZAkCOsB4AATpgDBfgAEgA8gA6lOs4LsuQHsCBTJbva+RONYmaPFysgZgeSFAgoMgqNIkEGmseo4bm+EQIRxCroQsBcAArvwYAMJ+v4ASO46riOA59kZ65sVEoEllxGhWD8shVNsN66BJNYnmQDjaHqBiJq24LtvJ3YESQKlqZp2m6f+gGGcZplARE7FypxiRElBLB2MC1RCmoWpIWoKGKGhdg+lhcnHHhQWKSFqkaVpOnflFBlGSZZlMN0iW2jGrhfL6DhVECmaSfGSTbFBSjaKNKQOBS2aiuVABGaBiDRABmK2EHgYA0VwXYMAOc4zgOI5UFQc79jRM7jrOfb9mdrGbna9wLNIZCQRJrhcjeZQas2L0IRB2TpSoDkzW2wYLUtq3rZt227fth3Had52Xddt2AeuCWWRxj1lnIxQuADkkE5heganoCFkCkWgrMS3n8n5OYQ8ta0bVtO3EAw-bDmO44AEojl+I68wAavdHVgduKhxmQQpJg5rhHq5OKKCsr0rEKUv2AUZVQotzPQ2zu1c++fMC0LosYw9MYyGs3y7t1uzJFoP0CTyQLOFodg6mo2GzQFTNQ6zsMc8bPPw0dJ1i1jSU40kIwvTlQIGr6Njkj9FTJhn5R2AsuyjDrAR64HMPs5zb481+NFUOZVsKskWyvQePxbKsSjSBqthpSw7uQYNeoPn74O65DLMl7t1H0eOX49nOvPo8B0edQqhQ-K96W-DIh43ioP2VGQNR+jqGw+78vtg0+5BF6Phsh+XE785Of4zq1Fm9DH1sjCor3ZOSOh6g4GpZDqA8j7Swygcr5RkAXS+I8DYDgADa8EYBPBi09Z7z1flcd+CpNYy2puTCw3ogHtzdFLF6fIahS09ssEYZ9-JD0LrA1mCCkGdFDhOcOiMo5vyXpLKoeC5aEMViQj4zhFh4hqA5BCjxBKSGgWQK+cDEGwEYOwqeVca7i2svcMoUEcrU00MDH4+p04pG+DeEqOpdAE3kYo5hyjVF31No-Z+3CsG8K4sDL4ssCEKzkErD4GF95+M9gYfUuxbFMM2iwlRnROEnTOn2C6V0Zw3T7HdTRi8JaeOqOYvEwJljoU2BqbYX8Dx+h-rsCCyhIn63sawvaB0I5IySSjVJaN4q10llyPJ0gClJjsMUnEB5kyt28snXQepQb0IvhQfgOBSJaU6CgqeM855uKsslDkywoK6DEdkfUZRhJulJF8RwFTTxxjkAPc+uFYDzMWY47m981wjhHFgDZ2MYxvXIeTXyvoaiTJ+sCbUglljU10BIuhjNzQPKWXtP808aIfN5uOAAUjRWcnzsHbkgjlaw+ULDAkzKMNkbocpWA0KSA0OgEL8nkfchZ8KByIp7MioW44qAjknD2BePDsmJDevIT6EEFijDsGoXeGwCXk0KoNd6cjB6zMZY85ZtFUFsp-D+bFHj7jeQ8uMIkmZgSax+ruRYz1SmPEwuoBmc1YVoC4DtNVk80HrMyfy7RZZ9XjAvMaz2cYfpxmKMkH0oT1AgmyAy-gjrnWUXVeOEcriPXuIFYgOwNYjyvXUG4SZPlVjyJIP0HASyBw4GIJteB8CS0DDIBgHA-RiBQEkLzMAK11LdgYA-J+q4UlpIyXy1NXr8grHIc4OwcYM5bA1GsL+gkpF8k5AUXY0yYUBCLYIEtkAy0VrAFWmtwglLFqWa29tna1HduTYOzZsciiOiblsamqw-jDXJl-Moih7CORvM4NwhbiDHu3eWyt1abhHs3SettHa2FOMva1TGnqtn5FsMmbqRQXCWGBjqMmyQCTpTesCAFvswTEDQPQeAUQ11gC0UhgAtDvZWaglgbD9KxtjNSlV3IlJaGjsdsQfA2O+ryXIUMVAWPIvAwG93wMgLx62+p8b1yqNTZYKsfogiY75TYhUDTKEDJxwKHQ5N134RUQ+cEdSIRxG4UklNfgaaqDBdK8iFJKWImRTAxntyFDcDLBCvofYGgQulJCNgeS6B-QhY8WZbmGeCspGq4UvOeMktm-KYaKhcl+EhTCHkVggycgUPYBnyrrWIDgeBhAABesmsnDr6YJEoE7P3oUcvMDUnJ0olAcK4AwmE4y1OLjfZL9wJolCXfqYEB4yikzdNURYp8JLVFsBx2LAdr4xNq4hvjuhrAIQ0BhA8DlZsfBXgSI8bgSTjGjUyrbQ6kN9IKN19eEE3oQRO2WIkL1yZ+i5L1RzxW1sOqdXdm91t0pfFsN6dKMiXA-RVmc9QXp8s2E-f+wDEAd0gYPXaMHy8byofUJ+41PptiyA6yCEobhBmHhVhS9HEGgO7v3WB+tjbm2nugyNss5RvFE-sJ7UnwMZ32CWLUKoJIjUM8IFuzHUmWe1o3TLyDZ6IDc6SGNjYCOGt-z6SLv6awyhFeBAUGanggA */
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
      if (showMachineOptions?.saveShowEvents) {
        if (inspectionEvent.type === '@xstate.event')
          createShowEvent(show, inspectionEvent.event);
      }
    }
  }).start();

  if (showMachineOptions?.saveState)
    showService.subscribe((state) => {
      if (state.context.show.save) {
        state.context.show.save();
      }
    });

  return showService;
};

/* eslint-disable @typescript-eslint/naming-convention */
import type { Queue } from 'bullmq';
import { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import { raise } from 'xstate/lib/actions';

import type {
  CancelType,
  FeedbackType,
  FinalizeType,
  RefundType,
  SaleType,
} from '$lib/models/common';
import type { ShowDocumentType } from '$lib/models/show';
import { ShowStatus } from '$lib/models/show';
import type { TicketDocumentType } from '$lib/models/ticket';
import type { TransactionDocumentType } from '$lib/models/transaction';

import type { ShowJobDataType } from '$lib/workers/showWorker';

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
}

export { ShowMachineEventString };

export { createShowMachine };

export const createShowMachineService = ({
  showDocument,
  showMachineOptions,
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
      const ticket = ('ticket' in event ? event.ticket : undefined) as
        | TicketDocumentType
        | undefined;
      const transaction = (
        'transaction' in event ? event.transaction : undefined
      ) as TransactionDocumentType | undefined;
      showMachineOptions.saveShowEventCallback &&
        showMachineOptions.saveShowEventCallback({
          type: event.type,
          ticket,
          transaction,
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
      type: 'TICKET RESERVED';
    }
  | {
      type: 'TICKET RESERVATION TIMEOUT';
    }
  | {
      type: 'TICKET CANCELLED';
      ticket: CancelType;
    }
  | {
      type: 'TICKET SOLD';
      sale: SaleType;
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
      ticket: TicketDocumentType;
    }
  | {
      type: 'CUSTOMER LEFT';
      ticket: TicketDocumentType;
    }
  | {
      type: 'ESCROW ENDED';
    };

export type ShowMachineOptions = {
  saveStateCallback?: (state: ShowStateType) => void;
  saveShowEventCallback?: ({
    type,
    ticket,
    transaction,
  }: {
    type: string;
    ticket?: TicketDocumentType;
    transaction?: TransactionDocumentType;
  }) => void;
  jobQueue?: Queue<ShowJobDataType, any, string>;
  gracePeriod?: number;
  escrowPeriod?: number;
};

export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;

const createShowMachine = ({
  showDocument,
  showMachineOptions,
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
        id: nanoid(),
      },
      tsTypes: {} as import('./showMachine.typegen').Typegen0,
      schema: {
        events: {} as ShowMachineEventType,
      },
      predictableActionArguments: true,
      id: 'showMachine',
      initial: 'showLoaded',

      states: {
        showLoaded: {
          always: [
            {
              target: 'boxOfficeOpen',
              cond: 'showBoxOfficeOpen',
            },
            {
              target: 'boxOfficeClosed',
              cond: 'showBoxOfficeClosed',
            },
            {
              target: 'initiatedCancellation',
              cond: 'showInitiatedCancellation',
            },
            {
              target: 'initiatedCancellation.initiatedRefund',
              cond: 'showInitiatedRefund',
            },
            {
              target: 'cancelled',
              cond: 'showCancelled',
            },
            {
              target: 'finalized',
              cond: 'showFinalized',
            },
            {
              target: 'started',
              cond: 'showStarted',
            },
            {
              target: 'stopped',
              cond: 'showStopped',
            },
            {
              target: 'inEscrow',
              cond: 'showInEscrow',
            },
          ],
        },
        cancelled: {
          type: 'final',
          entry: ['deactivateShow'],
        },
        inEscrow: {
          entry: ['makeShowNotCurrent', 'enterEscrow'],
          exit: ['exitEscrow'],
          on: {
            'SHOW FINALIZED': {
              target: 'finalized',
              actions: ['finalizeShow'],
            },
            'FEEDBACK RECEIVED': [
              {
                actions: [
                  'receiveFeedback',
                  raise({
                    type: 'SHOW FINALIZED',
                    finalize: {
                      _id: new Types.ObjectId(),
                      finalizedAt: new Date(),
                      finalizedBy: ActorType.CUSTOMER,
                    },
                  }),
                ],
                cond: 'fullyReviewed',
              },
              { actions: ['receiveFeedback'] },
            ],
          },
        },
        finalized: {
          type: 'final',
          entry: ['deactivateShow'],
        },
        boxOfficeOpen: {
          on: {
            'CANCELLATION INITIATED': [
              {
                target: 'cancelled',
                cond: 'canCancel',
                actions: ['initiateCancellation', 'cancelShow'],
              },
              {
                target: 'initiatedCancellation',
                actions: ['initiateCancellation'],
              },
            ],
            'TICKET RESERVED': [
              {
                target: 'boxOfficeClosed',
                cond: 'soldOut',
                actions: ['decrementTicketsAvailable', 'closeBoxOffice'],
              },
              {
                actions: ['decrementTicketsAvailable'],
              },
            ],
            'TICKET RESERVATION TIMEOUT': {
              actions: ['incrementTicketsAvailable'],
            },
            'TICKET CANCELLED': {
              actions: ['incrementTicketsAvailable'],
            },
            'TICKET SOLD': {
              actions: ['sellTicket'],
            },
            'SHOW STARTED': {
              target: 'started',
              cond: 'canStartShow',
              actions: ['startShow'],
            },
            'TICKET REFUNDED': [
              {
                actions: ['refundTicket'],
              },
            ],
          },
        },
        boxOfficeClosed: {
          on: {
            'SHOW STARTED': {
              cond: 'canStartShow',
              target: 'started',
              actions: ['startShow'],
            },
            'TICKET RESERVATION TIMEOUT': [
              {
                target: 'boxOfficeOpen',
                actions: ['openBoxOffice', 'incrementTicketsAvailable'],
              },
            ],
            'TICKET CANCELLED': [
              {
                target: 'boxOfficeOpen',
                actions: ['openBoxOffice', 'incrementTicketsAvailable'],
              },
            ],
            'TICKET SOLD': {
              actions: ['sellTicket'],
            },
            'TICKET REFUNDED': [
              {
                actions: ['refundTicket'],
              },
            ],
            'CANCELLATION INITIATED': [
              {
                target: 'cancelled',
                cond: 'canCancel',
                actions: ['initiateCancellation', 'cancelShow'],
              },
              {
                target: 'initiatedCancellation',
                actions: ['initiateCancellation'],
              },
            ],
          },
        },
        started: {
          on: {
            'SHOW STARTED': {
              actions: ['startShow'],
            },
            'CUSTOMER JOINED': {},
            'CUSTOMER LEFT': {},
            'SHOW STOPPED': {
              target: 'stopped',
              actions: ['stopShow'],
            },
          },
        },
        stopped: {
          on: {
            'SHOW STARTED': {
              target: 'started',
              actions: ['startShow'],
              cond: 'canStartShow',
            },
            'SHOW ENDED': {
              target: 'inEscrow',
              actions: ['endShow'],
            },
          },
        },
        initiatedCancellation: {
          initial: 'waiting2Refund',
          states: {
            waiting2Refund: {
              on: {
                'REFUND INITIATED': {
                  target: 'initiatedRefund',
                  actions: ['initiateRefund'],
                },
              },
            },
            initiatedRefund: {
              on: {
                'TICKET REFUNDED': [
                  {
                    target: '#showMachine.cancelled',
                    cond: 'fullyRefunded',
                    actions: ['refundTicket', 'cancelShow'],
                  },
                  {
                    actions: ['refundTicket'],
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      actions: {
        closeBoxOffice: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.BOX_OFFICE_CLOSED,
            },
          };
        }),

        openBoxOffice: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.BOX_OFFICE_OPEN,
            },
          };
        }),

        cancelShow: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.CANCELLED,
            },
          };
        }),

        startShow: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.LIVE,
              runtime: {
                startDate: new Date(),
                endDate: undefined,
              },
            },
          };
        }),

        endShow: assign((context, event) => {
          showMachineOptions?.jobQueue?.add(event.type, {
            showId: context.showDocument._id.toString(),
          });
          showMachineOptions?.jobQueue?.add(
            ShowMachineEventString.ESCROW_ENDED,
            {
              showId: context.showDocument._id.toString(),
            },
            { delay: ESCROW_PERIOD }
          );
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.ENDED,
            },
          };
        }),

        stopShow: assign((context, event) => {
          const startDate = context.showState.runtime?.startDate;
          if (!startDate) {
            throw new Error('Show start date is not defined');
          }
          showMachineOptions?.jobQueue?.add(
            event.type,
            {
              showId: context.showDocument._id.toString(),
            },
            { delay: GRACE_PERIOD }
          );

          return {
            showState: {
              ...context.showState,
              status: ShowStatus.STOPPED,
              runtime: {
                startDate,
                endDate: new Date(),
              },
            },
          };
        }),

        initiateCancellation: assign((context, event) => {
          showMachineOptions?.jobQueue?.add(event.type, {
            showId: context.showDocument._id.toString(),
            cancel: event.cancel,
          });
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.CANCELLATION_INITIATED,
              salesStats: {
                ...context.showState.salesStats,
                ticketsAvailable: 0,
              },
              cancel: event.cancel,
            },
          };
        }),

        initiateRefund: assign((context, event) => {
          showMachineOptions?.jobQueue?.add(event.type, {
            showId: context.showDocument._id.toString(),
          });
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.REFUND_INITIATED,
            },
          };
        }),

        receiveFeedback: (context, event) => {
          showMachineOptions?.jobQueue?.add(event.type, {
            showId: context.showDocument._id.toString(),
          });
        },

        refundTicket: assign((context, event) => {
          const st = context.showState;
          const refund = event.refund;

          const ticketsRefunded = st.salesStats.ticketsRefunded + 1;
          const ticketsSold = st.salesStats.ticketsSold - 1;
          const totalRefunded = st.salesStats.totalRefunded + refund.amount;
          const totalRevenue = st.salesStats.totalRevenue - refund.amount;
          st.refunds.push(refund._id);

          return {
            showState: {
              ...st,
              salesStats: {
                ...st.salesStats,
                ticketsRefunded,
                totalRefunded,
                ticketsSold,
                totalRevenue,
              },
            },
          };
        }),

        enterEscrow: assign((context) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.IN_ESCROW,
              escrow: {
                _id: new Types.ObjectId(),
                startedAt: new Date(),
              },
            },
          };
        }),

        exitEscrow: assign((context) => {
          if (!context.showState.escrow) return {};
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.IN_ESCROW,
              escrow: {
                ...context.showState.escrow,
                endedAt: new Date(),
              },
            },
          };
        }),

        deactivateShow: assign((context) => {
          return {
            showState: {
              ...context.showState,
              activeState: false,
              current: false,
            },
          };
        }),

        makeShowNotCurrent: assign((context) => {
          return {
            showState: {
              ...context.showState,
              current: false,
            },
          };
        }),

        incrementTicketsAvailable: assign((context) => {
          return {
            showState: {
              ...context.showState,
              salesStats: {
                ...context.showState.salesStats,
                ticketsAvailable:
                  context.showState.salesStats.ticketsAvailable + 1,
                ticketsReserved:
                  context.showState.salesStats.ticketsReserved - 1,
              },
            },
          };
        }),

        decrementTicketsAvailable: assign((context) => {
          return {
            showState: {
              ...context.showState,
              salesStats: {
                ...context.showState.salesStats,
                ticketsAvailable:
                  context.showState.salesStats.ticketsAvailable - 1,
                ticketsReserved:
                  context.showState.salesStats.ticketsReserved + 1,
              },
            },
          };
        }),

        sellTicket: assign((context, event) => {
          const st = context.showState;
          const sale = event.sale;
          if (!sale) {
            throw new Error('Ticket sale is not defined');
          }
          const ticketsSold = st.salesStats.ticketsSold + 1;
          const ticketsReserved = st.salesStats.ticketsReserved - 1;
          const totalSales = st.salesStats.totalSales + sale.amount;
          const totalRevenue = st.salesStats.totalRevenue + sale.amount;
          st.sales.push(sale._id);

          return {
            showState: {
              ...st,
              salesStats: {
                ...st.salesStats,
                ticketsSold,
                totalSales,
                ticketsReserved,
                totalRevenue,
              },
            },
          };
        }),

        finalizeShow: assign((context, event) => {
          showMachineOptions?.jobQueue?.add(event.type, {
            showId: context.showDocument._id.toString(),
            finalize: event.finalize,
          });
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.FINALIZED,
              finalized: event.finalize,
            },
          };
        }),
      },

      delays: {
        GRACE_DELAY: (context) => {
          const delay =
            +GRACE_PERIOD -
            (context.showState.runtime?.endDate
              ? Date.now() - context.showState.runtime.endDate.getTime()
              : 0);
          return delay > 0 ? delay : 0;
        },
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
        soldOut: (context) =>
          context.showState.salesStats.ticketsAvailable === 1,
        canStartShow: (context) => {
          if (context.showState.status === ShowStatus.ENDED) {
            // Allow grace period to start show again
            return (
              (context.showState.runtime?.startDate.getTime() ?? 0) +
                +GRACE_PERIOD >
              Date.now()
            );
          }
          return context.showState.salesStats.ticketsSold > 0;
        },
        fullyRefunded: (context, event) => {
          const refunded = event.type === 'TICKET REFUNDED' ? 1 : 0;
          return context.showState.salesStats.ticketsSold - refunded === 0;
        },
        fullyReviewed: (context, event) => {
          const count = event.type === 'FEEDBACK RECEIVED' ? 1 : 0;
          const fullReviewed =
            context.showState.feedbackStats.numberOfReviews + count ===
            context.showState.salesStats.ticketsSold;
          return fullReviewed;
        },
      },
    }
  );
};

export type ShowMachineStateType = StateFrom<typeof createShowMachine>;
export type ShowMachineType = ReturnType<typeof createShowMachine>;
export type ShowStateType = ShowDocumentType['showState'];

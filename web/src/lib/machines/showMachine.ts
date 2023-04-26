import { PUBLIC_ESCROW_PERIOD, PUBLIC_GRACE_PERIOD } from '$env/static/public';
import type { ShowDocument } from '$lib/ORM/models/show';
import { ShowStatus, type ShowDocType } from '$lib/ORM/models/show';
import type { TicketDocType, TicketDocument } from '$lib/ORM/models/ticket';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { ActorType } from '$lib/util/constants.js';
import { nanoid } from 'nanoid';
import { map, type Observable } from 'rxjs';
import {
  assign,
  createMachine,
  interpret,
  spawn,
  type ActorRef,
  type StateFrom,
  raise,
} from 'xstate';

const GRACE_PERIOD = +PUBLIC_GRACE_PERIOD || 3600000;
const ESCROW_PERIOD = +PUBLIC_ESCROW_PERIOD || 3600000;

export type ShowStateType = ShowDocType['showState'];

export type ShowStateCallbackType = (
  state: ShowStateType
) => Promise<ShowDocument>;

export const graceTimer = (timerStart: number) => {
  const timer = timerStart + GRACE_PERIOD - new Date().getTime();
  return timer > 0 ? timer : 0;
};

export const escrowTimer = (endTime: number) => {
  const timer = endTime + ESCROW_PERIOD - new Date().getTime();
  return timer > 0 ? timer : 0;
};

export enum ShowEventType {
  REQUEST_CANCELLATION = 'REQUEST CANCELLATION',
  TICKET_REFUNDED = 'TICKET REFUNDED',
  TICKET_RESERVED = 'TICKET RESERVED',
  TICKET_RESERVATION_TIMEOUT = 'TICKET RESERVATION TIMEOUT',
  TICKET_CANCELLED = 'TICKET CANCELLED',
  TICKET_SOLD = 'TICKET SOLD',
  START_SHOW = 'START SHOW',
  END_SHOW = 'END SHOW',
  SHOWSTATE_UPDATE = 'SHOWSTATE UPDATE',
}

const createShowStateObservable = (showDocument: ShowDocument) => {
  const showState$ = showDocument.get$(
    'showState'
  ) as Observable<ShowStateType>;

  return showState$.pipe(
    map(showState => ({ type: 'SHOWSTATE UPDATE', showState }))
  );
};

export const createShowMachine = ({
  showDocument,
  saveState,
  observeState,
}: {
  showDocument: ShowDocument;
  saveState: boolean;
  observeState: boolean;
}) => {
  /** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwAIAbNHCSAYgG0AGAXUVAAc1ZCAF0Jpi3EAA9EAJgAsbMgDYAnNLZsAzAEZp0gOxblWrQBoQATxmKNZPbOka2ejQFZlitXoC+Xs5Wz4RKQU6Bi09IwQrFpcSCB8AsKi4lIIcgoqapo6+obGZpYILtZkGrJljnp2ABwailo+fqG4BCTk-uEMzCzSsbz8QiJicanpSqrq2roGRqYWiBoOZGz21Spsinq6td6+IP4tQe2hnZGsGn3xA0nDoKPy41lTubMFiNWyZMWKHkZ6TtJ6tJGvtmoE2iFqHQulEWLJLglBskRjIHplJjkZvl5ghZPZxtpZMpVFpNNItIoQQdwcEOtCziwXAjrkMUqiMhNstM8nNCmpPnitHZii41FpHNUqWDWrSTvTuopmYlWSi0mjOc8sbzEFpZC4yLrjLVlHj5C4XFLMIcISQAKKwPAAJ0wTAksEEOEE5BwADMvY6ABRwJ2YAAiYBoOHMAEomNSZeQ7Q7nRh2EqkbdJIgqloyHJrK4flNNm8EFoXDZjOpFOVqtVpObVD49sQ0Ix4HF40dxIibmyEABaRSlgf64njtjitb1UmyS0BBOQsLyiA9lnIu6Ieyl5R6L5saTVFbODZEjQaefW4J4HDEPARmiQNfKjdZoqyap56Qm6o6f4ORRqlLX8yCJKtSTkXRZF2JorRpcgfRIHAaEIAAvJ84l7FVNwQE1pDIYkZyFfQ623HE1GUA07H0Ow6iJBtL3gsgkxDDBnwzfs3EUA1HGKD9yjYes9FLNR8JrA9SRcAwXFqPVGMXAAjNAJAAeR9RD7xUngwEzLDX1SFwPy-H8-wPOogPI+oCPkKppiMIwVnko4yCU1T1MIe8AGE6FgDD+hfTMDKM3QTP0MzANLYpc0MrRqmUYoTXkawnIhR0wAARwAVzgL0IE8297xoSM+0w9dAsQQzPxCj9TIAizCkWXM5HFc9lDWPQ2rsFLghIUNCFgHhMq9diSpwyrjJqsK6tLXUbFams62sXcZN2HwgA */
  return createMachine(
    {
      context: {
        showDocument,
        showStateRef: undefined as
          | ActorRef<{ type: string }, ShowStateType>
          | undefined,
        showState: JSON.parse(
          JSON.stringify(showDocument.showState)
        ) as ShowStateType,
        errorMessage: undefined as string | undefined,
        id: nanoid(),
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      tsTypes: {} as import('./showMachine.typegen.d.ts').Typegen0,
      schema: {
        events: {} as
          | {
              type: 'REQUEST CANCELLATION';
              cancel: ShowStateType['cancel'];
              tickets: TicketDocument[];
            }
          | {
              type: 'TICKET REFUNDED';
              transaction: TransactionDocType;
              ticket?: TicketDocType;
            }
          | {
              type: 'TICKET RESERVED';
              ticket?: TicketDocType;
            }
          | {
              type: 'TICKET RESERVATION TIMEOUT';
              ticket?: TicketDocType;
            }
          | {
              type: 'TICKET CANCELLED';
              ticket?: TicketDocType;
            }
          | {
              type: 'TICKET SOLD';
              transaction: TransactionDocType;
              ticket?: TicketDocType;
            }
          | {
              type: 'START SHOW';
            }
          | {
              type: 'END SHOW';
            }
          | {
              type: 'SHOW FINALIZED';
              finalize: ShowStateType['finalize'];
            }
          | {
              type: 'CUSTOMER JOINED';
              ticket: TicketDocType;
            }
          | {
              type: 'CUSTOMER LEFT';
              ticket: TicketDocType;
            }
          | {
              type: 'SHOWSTATE UPDATE';
              showState: ShowStateType;
            },
      },
      predictableActionArguments: true,
      id: 'showMachine',
      initial: 'showLoaded',
      entry: assign(() => {
        if (!observeState) {
          return {};
        }
        return {
          showStateRef: spawn(createShowStateObservable(showDocument)),
        };
      }),
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
              target: 'requestedCancellation',
              cond: 'showRequestedCancellation',
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
              target: 'ended',
              cond: 'showEnded',
            },
          ],
        },
        cancelled: {
          type: 'final',
          tags: ['canCreateShow'],

          entry: ['deactivateShow', 'saveShowState'],
        },
        finalized: {
          type: 'final',
          tags: ['canCreateShow'],

          entry: ['deactivateShow', 'saveShowState'],
        },
        boxOfficeOpen: {
          on: {
            'REQUEST CANCELLATION': [
              {
                target: 'cancelled',
                cond: 'canCancel',
                actions: ['requestCancellation', 'cancelShow', 'saveShowState'],
              },
              {
                target: 'requestedCancellation',
                actions: ['requestCancellation', 'saveShowState'],
              },
            ],
            'TICKET RESERVED': [
              {
                target: 'boxOfficeClosed',
                cond: 'soldOut',
                actions: [
                  'decrementTicketsAvailable',
                  'closeBoxOffice',
                  'saveShowState',
                ],
              },
              {
                actions: ['decrementTicketsAvailable', 'saveShowState'],
              },
            ],
            'TICKET RESERVATION TIMEOUT': {
              actions: ['incrementTicketsAvailable', 'saveShowState'],
            },
            'TICKET CANCELLED': {
              actions: ['incrementTicketsAvailable', 'saveShowState'],
            },
            'TICKET SOLD': {
              actions: ['sellTicket', 'saveShowState'],
            },
            'START SHOW': {
              target: 'started',
              cond: 'canStartShow',
              actions: ['startShow', 'saveShowState'],
            },
            'TICKET REFUNDED': [
              {
                actions: ['refundTicket', 'saveShowState'],
              },
            ],
          },
        },
        boxOfficeClosed: {
          on: {
            'START SHOW': {
              cond: 'canStartShow',
              target: 'started',
              actions: ['startShow', 'saveShowState'],
            },
            'TICKET RESERVATION TIMEOUT': [
              {
                target: 'boxOfficeOpen',
                actions: [
                  'openBoxOffice',
                  'incrementTicketsAvailable',
                  'saveShowState',
                ],
              },
            ],
            'TICKET CANCELLED': [
              {
                target: 'boxOfficeOpen',
                actions: [
                  'openBoxOffice',
                  'incrementTicketsAvailable',
                  'saveShowState',
                ],
              },
            ],
            'TICKET SOLD': {
              actions: ['sellTicket', 'saveShowState'],
            },
            'TICKET REFUNDED': [
              {
                actions: ['refundTicket', 'saveShowState'],
              },
            ],
            'REQUEST CANCELLATION': [
              {
                target: 'cancelled',
                cond: 'canCancel',
                actions: ['requestCancellation', 'cancelShow', 'saveShowState'],
              },
              {
                target: 'requestedCancellation',
                actions: ['requestCancellation', 'saveShowState'],
              },
            ],
          },
        },
        started: {
          on: {
            'START SHOW': {
              actions: ['startShow', 'saveShowState'],
            },
            'CUSTOMER JOINED': {
              actions: ['saveShowState'],
            },
            'CUSTOMER LEFT': {
              actions: ['saveShowState'],
            },
            'END SHOW': {
              target: 'ended',
              actions: ['endShow', 'saveShowState'],
            },
          },
        },
        ended: {
          after: {
            GRACE_DELAY: {
              actions: ['raiseFinalize'],
            },
          },
          on: {
            'START SHOW': {
              target: 'started',
              actions: ['startShow', 'saveShowState'],
            },
            'SHOW FINALIZED': {
              target: 'finalized',
              actions: ['finalizeShow', 'saveShowState'],
            },
          },
        },
        requestedCancellation: {
          initial: 'waiting2Refund',
          states: {
            waiting2Refund: {
              on: {
                'TICKET REFUNDED': {
                  actions: ['refundTicket', 'saveShowState'],
                },
                'TICKET CANCELLED': {
                  target: '#showMachine.cancelled',
                  cond: 'fullyRefunded',
                  actions: ['cancelShow', 'saveShowState'],
                },
              },
            },
          },
        },
      },
      on: {
        'SHOWSTATE UPDATE': {
          target: 'showLoaded',
          actions: ['updateShowState'],
          cond: 'canUpdateShowState',
        },
      },
    },
    {
      actions: {
        saveShowState: (context, event) => {
          if (!saveState) return {};

          const ticket = 'ticket' in event ? event.ticket : undefined;
          const transaction =
            'transaction' in event ? event.transaction : undefined;
          context.showDocument.createShowevent({
            type: event.type,
            ticket,
            transaction,
          });
          const showState = {
            ...context.showState,
            updatedAt: new Date().getTime(),
          };

          showDocument.saveShowStateCallback(showState);
        },

        updateShowState: assign((context, event) => {
          return {
            showState: {
              ...event.showState,
            },
          };
        }),

        closeBoxOffice: assign(context => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.BOX_OFFICE_CLOSED,
            },
          };
        }),

        openBoxOffice: assign(context => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.BOX_OFFICE_OPEN,
            },
          };
        }),

        cancelShow: assign(context => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.CANCELLED,
            },
          };
        }),

        startShow: assign(context => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.LIVE,
              startDate: new Date().getTime(),
              endDate: undefined,
            },
          };
        }),

        endShow: assign(context => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.ENDED,
              endDate: new Date().getTime(),
            },
          };
        }),

        requestCancellation: assign((context, event) => {
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.CANCELLATION_REQUESTED,
              ticketsAvailable: 0,
              cancel: event.cancel,
            },
          };
        }),

        refundTicket: assign((context, event) => {
          // Check if this is full refund for a ticket
          const ticketsRefunded = context.showState.ticketsRefunded + 1;

          return {
            showState: {
              ...context.showState,
              ticketsRefunded,
              refundedAmount:
                context.showState.refundedAmount + +event.transaction.value,
              transactions: [
                ...(context.showState.transactions || []),
                event.transaction._id,
              ],
            },
          };
        }),

        deactivateShow: assign(context => {
          if (!context.showState.active) return {};
          return {
            showState: {
              ...context.showState,
              active: false,
            },
          };
        }),

        incrementTicketsAvailable: assign(context => {
          return {
            showState: {
              ...context.showState,
              ticketsAvailable: context.showState.ticketsAvailable + 1,
              ticketsReserved: context.showState.ticketsReserved - 1,
            },
          };
        }),

        decrementTicketsAvailable: assign(context => {
          return {
            showState: {
              ...context.showState,
              ticketsAvailable: context.showState.ticketsAvailable - 1,
              ticketsReserved: context.showState.ticketsReserved + 1,
            },
          };
        }),

        sellTicket: assign((context, event) => {
          const state = context.showState;
          return {
            showState: {
              ...state,
              ticketsSold: state.ticketsSold + 1,
              totalSales: state.totalSales + +event.transaction.value,
              transactions: state.transactions
                ? [...state.transactions, event.transaction._id]
                : [event.transaction._id],
            },
          };
        }),

        raiseFinalize: raise({
          type: 'SHOW FINALIZED',
          finalize: {
            finalizedAt: new Date().getTime(),
            finalizer: ActorType.TIMER,
          },
        }),

        finalizeShow: assign((context, event) => {
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
        GRACE_DELAY: context => {
          const delay =
            +GRACE_PERIOD -
            (context.showState.endDate
              ? new Date().getTime() - context.showState.endDate
              : 0);
          return delay > 0 ? delay : 0;
        },
      },
      guards: {
        canCancel: context =>
          context.showState.ticketsSold - context.showState.ticketsRefunded ===
          0,
        showCancelled: context =>
          context.showState.status === ShowStatus.CANCELLED,
        showFinalized: context =>
          context.showState.status === ShowStatus.FINALIZED,
        showRequestedCancellation: context =>
          context.showState.status === ShowStatus.CANCELLATION_REQUESTED,
        showBoxOfficeOpen: context =>
          context.showState.status === ShowStatus.BOX_OFFICE_OPEN,
        showBoxOfficeClosed: context =>
          context.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
        showStarted: context => context.showState.status === ShowStatus.LIVE,
        showEnded: context => context.showState.status === ShowStatus.ENDED,
        soldOut: context => context.showState.ticketsAvailable === 1,
        canStartShow: context => {
          if (context.showState.status === ShowStatus.ENDED) {
            // Allow grace period to start show again
            return (
              (context.showState.startDate ?? 0) + +GRACE_PERIOD >
              new Date().getTime()
            );
          }
          return (
            context.showState.ticketsSold - context.showState.ticketsAvailable >
            0
          );
        },
        fullyRefunded: context => {
          return (
            context.showState.refundedAmount >= context.showState.totalSales
          );
        },
        canUpdateShowState: (context, event) => {
          const updateState =
            context.showState.updatedAt !== event.showState.updatedAt;
          return updateState;
        },
      },
    }
  );
};

export const createShowMachineService = ({
  showDocument,
  saveState,
  observeState,
}: {
  showDocument: ShowDocument;
  saveState: boolean;
  observeState: boolean;
}) => {
  const showMachine = createShowMachine({
    showDocument,
    saveState,
    observeState,
  });
  showMachine;
  const showService = interpret(showMachine).start();
  return showService;
};

export type ShowMachineType = ReturnType<typeof createShowMachine>;
export type ShowMachineStateType = StateFrom<typeof createShowMachine>;
export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;

import type { ShowDocument } from '../ORM/models/show';
import { ShowStatus, type ShowDocType } from '../ORM/models/show';
import type { TicketDocType, TicketDocument } from '../ORM/models/ticket';
import type { TransactionDocType } from '../ORM/models/transaction';
import { nanoid } from 'nanoid';
import { map, type Observable } from 'rxjs';
import {
  assign,
  createMachine,
  interpret,
  spawn,
  type ActorRef,
  type StateFrom,
} from 'xstate';

export type ShowStateType = ShowDocType['showState'];

export type ShowMachineOptions = {
  saveState: boolean;
  observeState: boolean;
  gracePeriod?: number;
  escrowPeriod?: number;
};

export type ShowStateCallbackType = (
  state: ShowStateType
) => Promise<ShowDocument>;

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

export const createShowMachine = (
  showDocument: ShowDocument,
  showMachineOptions: ShowMachineOptions
) => {
  const GRACE_PERIOD = showMachineOptions.gracePeriod || 3600000;

  /** @xstate-layout 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-S4yLitA0NcNDCb33rtG-UOSchwkJCcZoNQdhpvnAXaEnS-TvkuDEjaaj6EQCLdvN1843VODlBNeqIh7BmnOtSMUzQ3UjLujGGhJSO32s5frA1ywzZiORj0yoflLCkRLfCcauaW0onGdM2ZAKFXApWVc1JQ0rRhjuecQkdEvXbBjH7d5BxbB9uiUUo9vzT0QEBYq0FyhwVbJ2Xsg5RzO3XL9HDKJRwzZwkXDOTwI9rQTQUa4C4zEfBAA */
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
        if (!showMachineOptions.observeState) {
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
          if (!showMachineOptions.saveState) return {};

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

        // raiseFinalize: raise({
        //   type: 'SHOW FINALIZED',
        //   finalize: {
        //     finalizedAt: new Date().getTime(),
        //     finalizer: ActorType.TIMER,
        //   },
        // }),

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

export const createShowMachineService = (
  showDocument: ShowDocument,
  showMachineOptions: ShowMachineOptions
) => {
  const showMachine = createShowMachine(showDocument, showMachineOptions);
  showMachine;
  const showService = interpret(showMachine).start();
  return showService;
};

export type ShowMachineType = ReturnType<typeof createShowMachine>;
export type ShowMachineStateType = StateFrom<typeof createShowMachine>;
export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;

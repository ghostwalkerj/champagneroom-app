/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ShowDocType, ShowDocument } from '$lib/ORM/models/show';
import type { TicketDocType, TicketDocument } from '$lib/ORM/models/ticket';
import { TicketStatus } from '$lib/ORM/models/ticket';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { nanoid } from 'nanoid';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { ActorRef, ActorRefFrom } from 'xstate';
import {
  assign,
  createMachine,
  interpret,
  send,
  spawn,
  type StateFrom,
} from 'xstate';
import type { ShowMachineType } from './showMachine';
import { createShowMachine } from './showMachine';

type TicketStateType = TicketDocType['ticketState'];
type ShowStateType = ShowDocType['showState'];
// const PAYMENT_PERIOD = +PUBLIC_ESCROW_PERIOD || 3600000;

export type TicketStateCallbackType = (state: TicketStateType) => void;

// const paymentTimer = (timerStart: number) => {
//   const timer = timerStart + PAYMENT_PERIOD - new Date().getTime();
//   return timer > 0 ? timer : 0;
// };

const createTicketStateObservable = (ticketDocument: TicketDocument) => {
  const ticketState$ = ticketDocument.get$(
    'ticketState'
  ) as Observable<TicketStateType>;

  return ticketState$.pipe(
    map(ticketState => ({ type: 'TICKETSTATE UPDATE', ticketState }))
  );
};

export const createTicketMachine = ({
  ticketDocument,
  showDocument,
  saveState,
  observeState,
}: {
  ticketDocument: TicketDocument;
  showDocument: ShowDocument;
  saveState: boolean;
  observeState: boolean;
}) => {
  const parentShowMachine = createShowMachine({
    showDocument,
    saveState,
    observeState,
  });
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAxACoCSAwgNICiVAylQIJVMAEAqgAUAIlyYBtAAwBdRKAAOAe1io0C0rJAAPRABYATABoQAT0QBGABwBWHQDo9VvRYkB2AMw6zOiwE4Avn5GaFg4BMRklKwAEgDyAOo8dBwAcnRMADLpTEKSMkggisqq6vnaCPpGpghmTrY6Pg0+VlZuLj4uNToBQRjYeIQk5BTR8YkpaZnZYmZ58koqqGoaZRUmiG4+ZrZNbhJuVi4SZpYSXYEgwX1hg2C2lzjpCvgQkBS5GoULS6WIAGx7tj2NTMLhcejcbl+ZislUQ7Ss9h8egkFkO-zMEj03QuvVCAwid1xyEez1e01mBXmxWWiCsFjcgLcwNB4Mh0NhCCZW1+Vl+rIsxx0mN+Lmx9364XIhJCxKeLwgbz0FM+1J+CDBHL0Lh0v1s9NRenqngxVjFROuBPFJPlbzcyqpixKoDK-wZQL0ILBEKhMLWCD0Hp8gIsviOv3qjl+vzNMotUqtcrJOntRUdNIQVh8bqZHpZ3vZfpsFlsPJ91lOFgDpvO4rjtwTpIVYisKa+Tq0tMMft2LXsHh0Ll+PgkEiHMau+PjROtZN+rdVztp9MZzK9bN9VUNvL1bhDI8Ng+s47xktuACc4GAzwA3SC2ADu+AWpCgOgE+GMAFswKRkBQBBwACauBMMkVA8AASkwaQ0AAalM0gfA63yLtUDhBjoLRmBsByGq0HIuNuOhuHovwhiR7S7liNbmpO56Xjed6Ps+r7vl+P5-gBwGgeBUEwfBOQzEhqYoR21SOAio4OHoPiVpYTIbn8Iq2NCULItY0IkdWPSxnRtgXrAV63hAD5PmgL5vh+36-hQUEAIp8Ew7BjKkGTpFwNAxMk7z5CqaZqsiNS2K09SVpC4a-G4HJeNuGKYaFDjEVGx4Sjc+kMcZpksZZ7E2fZjnOUkrmZB5XnksJbbpu0LiImR3iYWp9LRVWth0r4pGuiCKV1ulhmMSZzHmaxVkcW8iG+ch7ZlDUmZ1FhOFgsRLgERidQkZFObuJsZjdXpBlGUxZlkK+rBEAo962UwDlOeBRUTO5tBleNcwiVNiCBXowXarJ4JRjqUV+mYkVbJ4hyka04K7aevUHQNR0Wad52XddhXjG5pXeUJE2vemxxmEGw58joxGtIRy2A1RiLIkao4CvjUNpft-VZUNOiIxdABSMQ0Mk2Q8CMcQ+S9lUBUcn0hT94X-dFDQ1WCWaLRiv3aTiunQ0zmUXgAjgArnAyCQHQ+CkOgYAADZm-gxQs8dOgQWAABmOukAqUEAGJ8MkQiQdBTBwQh87+ahH1fQlUuRc1NjBbu7XNMR+Mq7We0ZXe2t67ABsQEbJvm5b1uDbb9tOy7l0e17Pv8VMWPCwuYlAyRgI6ttKI6pWzXeLYbTUz4Qpkcc-g0WrjNgJAYDfgqWRu+BAtC5SOMBW0QZDs0EjNBsQrNJqxy6ruBztP88uJ7R6sjy848UFzPN8zPz1zyLwfuHYj-1DUIpDhYmqYhIa0ddq78jmcHSE4T6j3PgLHgoEhABwqrXF0XZNzDjsBLawTJW4DyASeNKZAmCwHQGeJGbsmDZAAEIcEYBXP2AlZ5+VEmUDYDJCL7l7vjMiWZNQWB5NHDhBpUQCkwgzAk2DcH4IukIGgrABB8G4DwHmNBaCiByLfGhb1ORZk7lYJho4WG+ABlUXYXgVLtE2C4awmYoQBHOKQBQLx4D5CTqeGBQcxIAFpfgclcYCEcXjvEjkFAIqcMoZwQEcbQ3QEJO48jpFRJE+g3GA1RDVAcPd1y8JMf4+ifVjIhJUZsOwMk6oWAajUJqhY2gll5NCQpOEDTpJhszAuFk2LWWQNk3GI4apIh8GRJwuZtRmAIj3VqfIpZtXrrUjWh1srs1aWqLpn18mFMKRUpwujzDLxLD9JoRwhRNFFIPYBw9MmpzALrfWhtjamwtlbJxyjcZ0jsKcIcxwW7dOikDLYMkE7hmsFmHu4yU4mTTmcrOFzc7XLUDbCyRdnbBOxvfOuYMSy9wcBsHuexoqtF1PjQpDhHC7EhvszBBILygMgDM4Ou5uQSGSQ4TSkJVn+lzFwpEoJiYmI4bU9AoKLZkrhbA96nhPqqQhH01wHpopQl1ITRwIZwS5PQarA5BIHZkHwGbVAAAvXlNcnEumwtsQp+gdjA3cOwg4a0NFdL5EOdatShF4POuSsSWoGT-CzJWLUIoknkz0acPJHhHD6HimOQlqVBGkCEKgWAcgdYGydWUTMNURT4wDF0-YhEGUkRHCpU4rRfBg08BYvwQA */
  return createMachine(
    {
      context: {
        ticketDocument,
        showDocument,
        ticketStateRef: undefined as
          | ActorRef<{ type: string }, TicketStateType>
          | undefined,
        ticketState: JSON.parse(
          JSON.stringify(ticketDocument.ticketState)
        ) as TicketStateType,
        errorMessage: undefined as string | undefined,
        id: nanoid(),
        showMachineRef: undefined as ActorRefFrom<ShowMachineType> | undefined,
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      tsTypes: {} as import('./ticketMachine.typegen').Typegen0,
      schema: {
        events: {} as
          | {
              type: 'REQUEST CANCELLATION';
              cancel: TicketStateType['cancel'];
            }
          | {
              type: 'REFUND RECEIVED';
              transaction: TransactionDocType;
            }
          | {
              type: 'PAYMENT RECEIVED';
              transaction: TransactionDocType;
            }
          | {
              type: 'FEEDBACK RECEIVED';
              feedback: NonNullable<TicketStateType['feedback']>;
            }
          | {
              type: 'DISPUTE INITIATED';
              dispute: NonNullable<TicketStateType['dispute']>;
            }
          | {
              type: 'JOINED SHOW';
            }
          | {
              type: 'LEFT SHOW';
            }
          | {
              type: 'SHOW ENDED';
            }
          | {
              type: 'SHOW CANCELLED';
              cancel: TicketStateType['cancel'];
            }
          | {
              type: 'TICKETSTATE UPDATE';
              ticketState: TicketStateType;
            },
      },
      predictableActionArguments: true,
      id: 'ticketMachine',
      initial: 'ticketLoaded',
      entry: assign(() => {
        const showMachineRef = spawn(parentShowMachine, { sync: true });

        if (observeState) {
          return {
            ticketStateRef: spawn(createTicketStateObservable(ticketDocument)),
            showMachineRef,
          };
        }
        return { showMachineRef };
      }),
      states: {
        ticketLoaded: {
          always: [
            {
              target: 'reserved',
              cond: 'ticketReserved',
            },
            {
              target: 'cancelled',
              cond: 'ticketCancelled',
            },
            {
              target: 'finalized',
              cond: 'ticketFinalized',
            },
            {
              target: 'reedemed',
              cond: 'ticketReedemed',
            },
            {
              target: '#ticketMachine.reserved.requestedCancellation',
              cond: 'ticketInCancellationRequested',
            },
            {
              target: 'inEscrow',
              cond: 'ticketInEscrow',
            },
            {
              target: 'inDispute',
              cond: 'ticketInDispute',
            },
          ],
        },
        reserved: {
          initial: 'waiting4Payment',
          states: {
            waiting4Payment: {
              always: [
                {
                  target: 'waiting4Show',
                  cond: 'fullyPaid',
                },
              ],
              on: {
                'PAYMENT RECEIVED': [
                  {
                    target: 'waiting4Show',
                    cond: 'fullyPaid',
                    actions: [
                      'receivePayment',
                      'saveTicketState',
                      'sendTicketSold',
                    ],
                  },
                  {
                    actions: ['receivePayment', 'saveTicketState'],
                  },
                ],
                'REQUEST CANCELLATION': [
                  {
                    target: '#ticketMachine.cancelled',
                    cond: 'canCancel',
                    actions: [
                      'requestCancellation',
                      'cancelTicket',
                      'saveTicketState',
                      'sendTicketCancelled',
                    ],
                  },
                  {
                    target: 'requestedCancellation',
                    actions: ['requestCancellation', 'saveTicketState'],
                  },
                ],
              },
            },
            waiting4Show: {
              on: {
                'REQUEST CANCELLATION': [
                  {
                    target: '#ticketMachine.cancelled',
                    cond: 'canCancel',
                    actions: [
                      'requestCancellation',
                      'cancelTicket',
                      'saveTicketState',
                      'sendTicketCancelled',
                    ],
                  },
                  {
                    target: '#ticketMachine.reserved.requestedCancellation',
                    cond: 'canRequestCancellation',
                    actions: ['requestCancellation', 'saveTicketState'],
                  },
                ],
                'JOINED SHOW': {
                  target: '#ticketMachine.reedemed',
                  cond: 'canWatchShow',
                  actions: [
                    'redeemTicket',
                    'saveTicketState',
                    'sendShowJoined',
                  ],
                },
              },
            },
            requestedCancellation: {
              initial: 'waiting4Refund',
              states: {
                waiting4Refund: {
                  on: {
                    'REFUND RECEIVED': [
                      {
                        target: '#ticketMachine.cancelled',
                        cond: 'fullyRefunded',
                        actions: [
                          'receiveRefund',
                          'cancelTicket',
                          'saveTicketState',
                          'sendTicketRefunded',
                          'sendTicketCancelled',
                        ],
                      },
                      {
                        actions: ['receiveRefund', 'saveTicketState'],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        reedemed: {
          on: {
            'LEFT SHOW': { actions: ['sendShowLeft'] },
            'JOINED SHOW': {
              cond: 'canWatchShow',
              actions: ['sendShowJoined'],
            },
            'SHOW ENDED': {
              target: '#ticketMachine.inEscrow',
              actions: ['enterEscrow', 'saveTicketState', 'sendShowLeft'],
            },
          },
        },
        cancelled: {
          type: 'final',
          entry: ['deactivateTicket', 'saveTicketState'],
        },
        finalized: {
          type: 'final',
          entry: ['deactivateTicket', 'saveTicketState'],
        },
        inEscrow: {
          on: {
            'FEEDBACK RECEIVED': {
              target: 'finalized',
              actions: ['receiveFeedback', 'finalizeTicket', 'saveTicketState'],
            },
            'DISPUTE INITIATED': {
              target: 'inDispute',
              actions: ['initiateDispute', 'saveTicketState'],
            },
          },
        },
        inDispute: {},
      },
      on: {
        'TICKETSTATE UPDATE': {
          target: 'ticketLoaded',
          cond: 'canUpdateTicketState',
          actions: ['updateTicketState'],
        },
        'SHOW CANCELLED': [
          {
            target: '#ticketMachine.cancelled',
            cond: 'canCancel',
            actions: [
              'requestCancellation',
              'cancelTicket',
              'saveTicketState',
              'sendTicketCancelled',
            ],
          },
          {
            target: '#ticketMachine.reserved.requestedCancellation',
            actions: ['requestCancellation', 'saveTicketState'],
          },
        ],
      },
    },
    {
      actions: {
        saveTicketState: context => {
          if (!saveState) return;
          const ticketState = {
            ...context.ticketState,
            updatedAt: new Date().getTime(),
          };
          ticketDocument.saveTicketStateCallback(ticketState);
        },

        updateTicketState: assign((context, event) => {
          return {
            ticketState: {
              ...event.ticketState,
            },
          };
        }),

        sendShowJoined: send(
          context => ({
            type: 'CUSTOMER JOINED',
            ticket: context.ticketDocument,
          }),
          { to: context => context.showMachineRef! }
        ),

        sendShowLeft: send(
          context => ({
            type: 'CUSTOMER LEFT',
            ticket: context.ticketDocument,
          }),
          { to: context => context.showMachineRef! }
        ),

        sendTicketSold: send(
          (context, event) => ({
            type: 'TICKET SOLD',
            ticket: context.ticketDocument,
            transaction: event.transaction,
          }),
          { to: context => context.showMachineRef! }
        ),

        sendTicketRefunded: send(
          (context, event) => ({
            type: 'TICKET REFUNDED',
            ticket: context.ticketDocument,
            transaction: event.transaction,
          }),
          { to: context => context.showMachineRef! }
        ),

        sendTicketCancelled: send(
          context => ({
            type: 'TICKET CANCELLED',
            ticket: context.ticketDocument,
          }),
          { to: context => context.showMachineRef! }
        ),

        requestCancellation: assign((context, event) => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.CANCELLATION_REQUESTED,
              cancel: event.cancel,
            },
          };
        }),

        redeemTicket: assign(context => {
          if (context.ticketState.status === TicketStatus.REDEEMED) return {};
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.REDEEMED,
              redemption: {
                createdAt: new Date().getTime(),
              },
            },
          };
        }),

        cancelTicket: assign(context => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.CANCELLED,
            },
          };
        }),

        deactivateTicket: assign(context => {
          return {
            ticketState: {
              ...context.ticketState,
              active: false,
            },
          };
        }),

        receivePayment: assign((context, event) => {
          const state = context.ticketState;
          return {
            ticketState: {
              ...context.ticketState,
              totalPaid:
                context.ticketState.totalPaid + +event.transaction.value,
              transactions: state.transactions
                ? [...state.transactions, event.transaction._id]
                : [event.transaction._id],
            },
          };
        }),

        receiveRefund: assign((context, event) => {
          const state = context.ticketState;
          return {
            ticketState: {
              ...context.ticketState,
              refundedAmount:
                context.ticketState.refundedAmount + +event.transaction.value,
              transactions: state.transactions
                ? [...state.transactions, event.transaction._id]
                : [event.transaction._id],
            },
          };
        }),

        receiveFeedback: assign((context, event) => {
          return {
            ticketState: {
              ...context.ticketState,
              feedback: event.feedback,
            },
          };
        }),

        initiateDispute: assign((context, event) => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.IN_DISPUTE,
              dispute: event.dispute,
            },
          };
        }),

        enterEscrow: assign(context => {
          return {
            ticketState: {
              ...context.ticketState,
              escrow: {
                ...context.ticketState.escrow,
                startedAt: new Date().getTime(),
              },
            },
          };
        }),

        finalizeTicket: assign(context => {
          const finalized = {
            endedAt: new Date().getTime(),
          } as NonNullable<TicketStateType['finalized']>;
          if (context.ticketState.status !== TicketStatus.FINALIZED) {
            return {
              ticketState: {
                ...context.ticketState,
                finalized: finalized,
                status: TicketStatus.FINALIZED,
              },
            };
          }
          return {};
        }),
      },
      guards: {
        canCancel: context => {
          const canCancel =
            context.ticketState.totalPaid <= context.ticketState.refundedAmount;

          return canCancel;
        },
        ticketCancelled: context =>
          context.ticketState.status === TicketStatus.CANCELLED,
        ticketFinalized: context =>
          context.ticketState.status === TicketStatus.FINALIZED,
        ticketInDispute: context =>
          context.ticketState.status === TicketStatus.IN_DISPUTE,
        ticketInEscrow: context =>
          context.ticketState.status === TicketStatus.IN_ESCROW,
        ticketReserved: context =>
          context.ticketState.status === TicketStatus.RESERVED,
        ticketReedemed: context =>
          context.ticketState.status === TicketStatus.REDEEMED,
        ticketInCancellationRequested: context =>
          context.ticketState.status === TicketStatus.CANCELLATION_REQUESTED,
        fullyPaid: (context, event) => {
          const value =
            event.type === 'PAYMENT RECEIVED' ? event.transaction?.value : 0;
          return (
            context.ticketState.totalPaid + +value >= context.ticketState.price
          );
        },
        fullyRefunded: (context, event) => {
          const value =
            event.type === 'REFUND RECEIVED' ? event.transaction?.value : 0;
          return (
            context.ticketState.refundedAmount + +value >=
            context.ticketState.totalPaid
          );
        },
        canWatchShow: context => {
          const state = context.showMachineRef?.getSnapshot();
          return (
            state !== undefined &&
            context.ticketState.totalPaid >= context.ticketState.price &&
            state.matches('started')
          );
        },
        canUpdateTicketState: (context, event) => {
          const updateState =
            context.ticketState.updatedAt !== event.ticketState.updatedAt;

          return updateState;
        },
      },
    }
  );
};

export const createTicketMachineService = ({
  ticketDocument,
  showDocument,
  saveState,
  observeState,
}: {
  ticketDocument: TicketDocument;
  showDocument: ShowDocument;
  saveState: boolean;
  observeState: boolean;
}) => {
  const ticketMachine = createTicketMachine({
    ticketDocument,
    showDocument,
    saveState,
    observeState,
  });
  return interpret(ticketMachine).start();
};

export type ticketMachineType = ReturnType<typeof createTicketMachine>;
export type ticketMachineStateType = StateFrom<
  ReturnType<typeof createTicketMachine>
>;
export type ticketMachineServiceType = ReturnType<
  typeof createTicketMachineService
>;

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ShowDocument } from '../ORM/models/show';
import type { TicketDocType, TicketDocument } from '../ORM/models/ticket';
import { TicketStatus } from '../ORM/models/ticket';
import type { TransactionDocType } from '../ORM/models/transaction';
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
import type { ShowMachineOptions, ShowMachineType } from './showMachine';
import { createShowMachine } from './showMachine';

type TicketStateType = TicketDocType['ticketState'];
export type TicketMachineOptions = {
  saveState: boolean;
  observeState: boolean;
  gracePeriod?: number;
  escrowPeriod?: number;
};

export type TicketStateCallbackType = (
  state: TicketStateType
) => Promise<TicketDocument>;

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

export const createTicketMachine = (
  ticketDocument: TicketDocument,
  showDocument: ShowDocument,
  tickeMachineOptions: TicketMachineOptions
) => {
  const parentShowMachine = createShowMachine(
    showDocument,
    tickeMachineOptions as ShowMachineOptions
  );
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAxACoCSAwgNICiVAylQIJVMAEAqgAUAIlyYBtAAwBdRKAAOAe1io0C0rJAAPRABYATABoQAT0QBGABwBWHQDo9VgMx6dATlcB2F3sc6Avn5GaFg4BMRklKwAEgDyAOo8dBwAcnRMADLpTEKSMkggisqq6vnaCPpGpghmeha2VhKNEhauVgBsro0ejgFBGNh4hCTkFNHxiSlpmdliZnnySiqoahplFSaIjq5mtq2OZjoNVhYSjha9IMEDYcNgtlc46Qr4EJAUuRqFSyuliG2ntlONVcegkbS8ZjBlUQnis9hBtQknmanR6gUu-VCQwi90xyCeLzes3mBUWxVWiGOjkB+z0ILBEKhGwQ+x2bXaem6nLMnVcFg8Fweg3C5FxIXxz1eEHeehJX3JvwQXmhCE5OjatgsW1qjnZVksFn86KFNxxQoJUvejjlZOWJVAZX+1KBdNB4L0kLaKr0HtcgJakKc6osbXBgrxptF5slRJ0NqKdopCCsrmdtPp7s9KpsdXZbT0-wkOh0NQ8ZnD4sjd2jhOlYis8e+9q0lMMzMcEic9kc+s6EjMBzaFeu2KjeItRLajYVDspWppwLdjK9zJc7U1WyLblq7Vcw6xIruACc4GAjwA3SC2ADu+CWpCgOgE+GMAFswKRkBQBBwAJq4JhkioHgACUmDSGgADUZmkT5bR+WdqgcP1DlZbYJA8EszBVDx1x0Zx0JODsGnOY0I1HY9TwvK9b3vR9nzfD8vx-f9AOAsCIOgnI5jghMEJbaorAcQF82OCQfS2GoLBVUMPFsMwOUNEFULacsyMrCjbBPWAz0vCAbzvNAHyfF930-CgwIART4Jh2AmVIMnSLgaBiZIPnyeVE0VUEalsRxMNcNxDkOdppOZA510hdUDlTU4LBDfdhVuLSqL0gy6JMxjzKsmy7KSBzMmc1ziV4psk08OS6Q6HddSEnQVRqYTjm2Tl+VDJEh3UkdDxSnTqP02ijPo0ymPeWCPPg5syhqFNbFQgd0MwgccMhOaCP5ftAscLZEqrXrdJowyyEfVgiAUa8LKYazbOA-Kpic2hivGhY+KmxAfL0PyAqCmwrFChq2n2OazDLXDOx0DwMIFLqD2S7SDoGo7jNO87LuuvLJkcoq3J4ibXqTAceV2MEfHw8FXAas5PtdNUew6dxds0+H+vSoadBRi6ACkYhoZJsh4MY4ncl6yu8-tPv8oLAt+-7wvcOSvE8HsQc6As9xhpKcWZtKTwARwAVzgZBIDofBSHQMAABtLfwYpWeOnQQLAAAzfXSGlMCADE+GSIRQPApgoJg6cvMQj6vql4K-raMKqhmuxtpaQ0PTpRpOr6DSeu1q89cN2BjYgU3zatm27cGh2ndd93Lu933-c4mZcZFmcBLMQHPqLGPk-+Dx+SsBqXDqDwEUwun3HVjPurhsBIDAd9pSyT3gMF4XSXx7zh79DohKRD1xcw70Bw1M4Uw7NuKrRSfYa1mfXnnihud5-mV+etfRbD7o7E-jtXFDD1sNXOJCQa1OQYROB6QG6cMSZ2nrPe+gseCASEMHUqLdHRtiqKnBOuELAFkOLhAc0Mr6a1FGQJgsB0BHlRp7Jg2QABCHBGD10DlxVenl+JlC2NSMGpw2jqh8LhXU3oQxwm2iCDwkMSxVSgSaTSZCKFUIukIGgrABB8G4DwXmNBaCiByK-dhb0WSplsDw3U-D-JOBXFUM+dgeQhh0J2Voa5obolIAoV48B8iyMPKg0OAkAC0VjED+LhOPMJ4TcGtEZj1GsUpfEcN0NtExeZDg+hcN0VoDV+RyQhr-QGacfC1GidPPqel4mGO2HYKqIJrC1RcNmYetg8zISDBI7oxSb6lMOhlBiZlkDlIJl0XY1Tf5Fg9IaHCgV6iiQkfFJwBxSLEL2tnRGGUOYDMVL-amv8amWLqgDVoTS+TFjML4TsEiOmihWSlA2RsTZmwttbW2fiDEE2OHYTu8V9A9z7g1NuOwaY6BaO6Bxl9oFT06QjG5ecC5F0eaXO09tjKVzdhADZiEQbiSaQ4-4Phf4gxDJTDwGo7HtG6CDNpizwXXyubfOekB0UCR8BYNkSJnBbAcWy+qq4PRyTEQpBw-kqaXLuOgB5JcGV43fkyqR8l2gKWOPmGOEiAZt2JuCfUxFpYyPIj1Z2ZB8CW1QAAL0lc3PxjpTm7ENOqXw+oOSOGEVYHJPYUzOu3r4EVth5GUPOoysonJqT-FTN0dkbgywU3bFubsQk-qnPBBInVMCcRkCEKgWAch9bG39ZSTwTSI2cnZAtY4KpnCNHkkWX+21xJajRAEIAA */
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
      tsTypes: {} as import('./ticketMachine.typegen.d.ts').Typegen0,
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
              feedback: TicketStateType['feedback'];
            }
          | {
              type: 'DISPUTE INITIATED';
              dispute: TicketStateType['dispute'];
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

        if (tickeMachineOptions.observeState) {
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
              target: '#ticketMachine.ended.inEscrow',
              cond: 'ticketInEscrow',
            },
            {
              target: '#ticketMachine.ended.inDispute',
              cond: 'ticketInDispute',
            },
            {
              target: '#ticketMachine.ended.missedShow',
              cond: 'ticketMissedShow',
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
                    'sendJoinedShow',
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
          on: {
            'SHOW ENDED': {
              target: '#ticketMachine.ended.missedShow',
              actions: ['missShow', 'saveTicketState'],
            },
          },
        },
        reedemed: {
          on: {
            'LEFT SHOW': { actions: ['sendLeftShow'] },
            'JOINED SHOW': {
              cond: 'canWatchShow',
              actions: ['sendJoinedShow'],
            },
            'SHOW ENDED': {
              target: '#ticketMachine.ended',
              actions: ['enterEscrow', 'saveTicketState'],
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
        ended: {
          initial: 'inEscrow',
          states: {
            inEscrow: {
              on: {
                'FEEDBACK RECEIVED': {
                  target: '#ticketMachine.finalized',
                  actions: [
                    'receiveFeedback',
                    'finalizeTicket',
                    'saveTicketState',
                  ],
                },
                'DISPUTE INITIATED': {
                  target: 'inDispute',
                  actions: ['initiateDispute', 'saveTicketState'],
                },
              },
            },
            inDispute: {},
            missedShow: {},
          },
        },
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
          if (!tickeMachineOptions.saveState) return;
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

        sendJoinedShow: send(
          context => ({
            type: 'CUSTOMER JOINED',
            ticket: context.ticketDocument,
          }),
          { to: context => context.showMachineRef! }
        ),

        sendLeftShow: send(
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
              status: TicketStatus.IN_ESCROW,
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
          } as NonNullable<TicketStateType['finalize']>;
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

        missShow: assign(context => {
          return {
            ticketState: {
              ...context.ticketState,
              status: TicketStatus.MISSED_SHOW,
            },
          };
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
        ticketMissedShow: context =>
          context.ticketState.status === TicketStatus.MISSED_SHOW,
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
        canRequestCancellation: context => {
          const state = context.showMachineRef?.getSnapshot();
          return state?.context.showState.startDate === undefined; // show has not started
          //TODO: Check this
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

export const createTicketMachineService = (
  ticketDocument: TicketDocument,
  showDocument: ShowDocument,
  tickeMachineOptions: TicketMachineOptions
) => {
  const ticketMachine = createTicketMachine(
    ticketDocument,
    showDocument,
    tickeMachineOptions
  );
  return interpret(ticketMachine).start();
};

export type ticketMachineType = ReturnType<typeof createTicketMachine>;
export type ticketMachineStateType = StateFrom<
  ReturnType<typeof createTicketMachine>
>;
export type ticketMachineServiceType = ReturnType<
  typeof createTicketMachineService
>;

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ShowDocType } from '$lib/models/show';
import type { TicketDocType, TicketStateType } from '$lib/models/ticket';
import { TicketStatus } from '$lib/models/ticket';
import type { TransactionDocType } from '$lib/models/transaction';
import { nanoid } from 'nanoid';
import {
  assign,
  createMachine,
  interpret,
  send,
  spawn,
  type ActorRef,
  type ActorRefFrom,
  type StateFrom,
} from 'xstate';
import {
  createShowMachine,
  type ShowMachineOptions,
  type ShowMachineType,
} from './showMachine';

export type TicketMachineOptions = {
  saveStateCallback?: (state: TicketStateType) => void;
  gracePeriod?: number;
  escrowPeriod?: number;
};

export const createTicketMachine = (
  ticketDocument: TicketDocType,
  showDocument: ShowDocType,
  ticketMachineOptions?: TicketMachineOptions,
  showMachineOptions?: ShowMachineOptions
) => {
  const parentShowMachine = createShowMachine(showDocument, showMachineOptions);

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
                    actions: ['receivePayment', 'sendTicketSold'],
                  },
                  {
                    actions: ['receivePayment'],
                  },
                ],
                'REQUEST CANCELLATION': [
                  {
                    target: '#ticketMachine.cancelled',
                    cond: 'canCancel',
                    actions: [
                      'requestCancellation',
                      'cancelTicket',
                      'sendTicketCancelled',
                    ],
                  },
                  {
                    target: 'requestedCancellation',
                    actions: ['requestCancellation'],
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
                      'sendTicketCancelled',
                    ],
                  },
                  {
                    target: '#ticketMachine.reserved.requestedCancellation',
                    cond: 'canRequestCancellation',
                    actions: ['requestCancellation'],
                  },
                ],
                'JOINED SHOW': {
                  target: '#ticketMachine.reedemed',
                  cond: 'canWatchShow',
                  actions: ['redeemTicket', 'sendJoinedShow'],
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
                          'sendTicketRefunded',
                          'sendTicketCancelled',
                        ],
                      },
                      {
                        actions: ['receiveRefund'],
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
              actions: ['missShow'],
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
              actions: ['enterEscrow'],
            },
          },
        },
        cancelled: {
          type: 'final',
        },
        finalized: {
          type: 'final',
        },
        ended: {
          initial: 'inEscrow',
          states: {
            inEscrow: {
              on: {
                'FEEDBACK RECEIVED': {
                  target: '#ticketMachine.finalized',
                  actions: ['receiveFeedback', 'finalizeTicket'],
                },
                'DISPUTE INITIATED': {
                  target: 'inDispute',
                  actions: ['initiateDispute'],
                },
              },
            },
            inDispute: {},
            missedShow: {},
          },
        },
      },
      on: {
        'SHOW CANCELLED': [
          {
            target: '#ticketMachine.cancelled',
            cond: 'canCancel',
            actions: [
              'requestCancellation',
              'cancelTicket',
              'sendTicketCancelled',
            ],
          },
          {
            target: '#ticketMachine.reserved.requestedCancellation',
            actions: ['requestCancellation'],
          },
        ],
      },
    },
    {
      actions: {
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
                redeemedAt: new Date(),
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
                context.ticketState.totalRefunded + +event.transaction.value,
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
                startedAt: new Date(),
              },
            },
          };
        }),

        finalizeTicket: assign(context => {
          const finalized = {
            finalizedAt: new Date(),
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
            context.ticketState.totalPaid <= context.ticketState.totalRefunded;

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
            context.ticketState.totalPaid + +value >=
            context.ticketDocument.price
          );
        },
        fullyRefunded: (context, event) => {
          const value =
            event.type === 'REFUND RECEIVED' ? event.transaction?.value : 0;
          return (
            context.ticketState.totalRefunded + +value >=
            context.ticketState.totalPaid
          );
        },
        canRequestCancellation: context => {
          const state = context.showMachineRef?.getSnapshot();
          return state?.context.showState.runtime === undefined; // show has not started
          //TODO: Check this
        },
        canWatchShow: context => {
          const state = context.showMachineRef?.getSnapshot();
          return (
            state !== undefined &&
            context.ticketState.totalPaid >= context.ticketDocument.price &&
            state.matches('started')
          );
        },
      },
    }
  );
};

export const createTicketMachineService = (
  ticketDocument: TicketDocType,
  showDocument: ShowDocType,
  tickeMachineOptions?: TicketMachineOptions,
  showMachineOptions?: ShowMachineOptions
) => {
  const ticketMachine = createTicketMachine(
    ticketDocument,
    showDocument,
    tickeMachineOptions,
    showMachineOptions
  );
  const ticketServce = interpret(ticketMachine).start();

  if (tickeMachineOptions?.saveStateCallback) {
    ticketServce.onChange(context => {
      tickeMachineOptions.saveStateCallback &&
        tickeMachineOptions.saveStateCallback(context.ticketState);
    });
  }

  return ticketServce;
};

export type ticketMachineType = ReturnType<typeof createTicketMachine>;
export type ticketMachineStateType = StateFrom<
  ReturnType<typeof createTicketMachine>
>;
export type ticketMachineServiceType = ReturnType<
  typeof createTicketMachineService
>;

import { PUBLIC_ESCROW_PERIOD, PUBLIC_GRACE_PERIOD } from '$env/static/public';
import { ShowStatus, type ShowDocType } from '$lib/ORM/models/show';
import type { TicketDocType } from '$lib/ORM/models/ticket';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

const GRACE_PERIOD = +PUBLIC_GRACE_PERIOD || 90000;
const ESCROW_PERIOD = +PUBLIC_ESCROW_PERIOD || 3600000;

type ShowStateType = ShowDocType['showState'];

export type ShowStateCallbackType = (state: ShowStateType) => void;

export const graceTimer = (timerStart: number) => {
  const timer = timerStart + GRACE_PERIOD - new Date().getTime();
  return timer > 0 ? timer : 0;
};

export const escrowTimer = (endTime: number) => {
  const timer = endTime + ESCROW_PERIOD - new Date().getTime();
  return timer > 0 ? timer : 0;
};

export const createShowMachine = ({
  showState,
  saveShowStateCallback,
}: {
  showState: ShowStateType;
  saveShowStateCallback?: ShowStateCallbackType;
}) => {
  /** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwAIAbNHCSAYgG0AGAXUVAAc1ZCAF0Jpi3EAA9EAJgAsbMgDYAnNLZsAzAEZp0gOxblWrQBoQATxmKNZPbOka2ejQFZlitXoC+Xs5Wz4RKQU6Bi09IwQrFpcSCB8AsKi4lIIcgoqapo6+obGZpYILtZkGrJljnp2ABwailo+fqG4BCTk-uEMzCzSsbz8QiJicanpSqrq2roGRqYWiBoOZGz21Spsinq6td6+IP4tQe2hnZGsGn3xA0nDoKPy41lTubMFiNWyZMWKHkZ6TtJ6tJGvtmoE2iFqHQulEWLJLglBskRjIHplJjkZvl5ghZPZxtpZMpVFpNNItIoQQdwcEOtCziwXAjrkMUqiMhNstM8nNCmpPnitHZii41FpHNUqWDWrSTvTuopmYlWSi0mjOc8sbzEFpZC4yLrjLVlHj5C4XFLMIcISQAKKwPAAJ0wTAksEEOEE5BwADMvY6ABRwJ2YAAiYBoOHMAEomNSZeQ7Q7nRh2EqkbdJIgqloyHJrK4flNNm8EFoXDZjOpFOVqtVpObVD49sQ0Ix4HF40dxIibmyEABaRSlgf64njtjitb1UmyS0BBOQsLyiA9lnIu6Ieyl5R6L5saTVFbODZEjQaefW4J4HDEPARmiQNfKjdZoqyap56Qm6o6f4ORRqlLX8yCJKtSTkXRZF2JorRpcgfRIHAaEIAAvJ84l7FVNwQE1pDIYkZyFfQ623HE1GUA07H0Ow6iJBtL3gsgkxDDBnwzfs3EUA1HGKD9yjYes9FLNR8JrA9SRcAwXFqPVGMXAAjNAJAAeR9RD7xUngwEzLDX1SFwPy-H8-wPOogPI+oCPkKppiMIwVnko4yCU1T1MIe8AGE6FgDD+hfTMDKM3QTP0MzANLYpc0MrRqmUYoTXkawnIhR0wAARwAVzgL0IE8297xoSM+0w9dAsQQzPxCj9TIAizCkWXM5HFc9lDWPQ2rsFLghIUNCFgHhMq9diSpwyrjJqsK6tLXUbFams62sXcZN2HwgA */
  return createMachine(
    {
      context: {
        showState: showState,
        errorMessage: undefined as string | undefined,
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      tsTypes: {} as import('./showMachine.typegen').Typegen0,
      schema: {
        events: {} as
          | {
              type: 'REQUEST CANCELLATION';
              cancel: ShowStateType['cancel'];
            }
          | {
              type: 'REFUND SENT';
              transaction: TransactionDocType;
              ticket: TicketDocType;
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
              ticket: TicketDocType;
            }
          | {
              type: 'START SHOW';
            }
          | {
              type: 'END SHOW';
            },
      },
      predictableActionArguments: true,
      id: 'showMachine',
      initial: 'show loaded',
      states: {
        'show loaded': {
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
              target: 'inEscrow',
              cond: 'showInEscrow',
            },
            {
              target: 'inDispute',
              cond: 'showInDispute',
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
        },
        finalized: {
          type: 'final',
        },
        inEscrow: {},
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
            'REFUND SENT': [
              {
                actions: ['sendRefund', 'saveShowState'],
              },
            ],
          },
        },
        boxOfficeClosed: {
          on: {
            'START SHOW': {
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
            'REFUND SENT': [
              {
                actions: ['sendRefund', 'saveShowState'],
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
            'END SHOW': {
              target: 'ended',
              actions: ['endShow', 'saveShowState'],
            },
          },
        },
        ended: {},
        requestedCancellation: {
          initial: 'waiting2Refund',
          states: {
            waiting2Refund: {
              on: {
                'REFUND SENT': [
                  {
                    target: '#showMachine.cancelled',
                    cond: 'fullyRefunded',
                    actions: ['sendRefund', 'cancelShow', 'saveShowState'],
                  },
                  {
                    actions: ['sendRefund', 'saveShowState'],
                  },
                ],
              },
            },
          },
        },
        inDispute: {},
      },
    },
    {
      actions: {
        closeBoxOffice: assign(context => {
          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
              status: ShowStatus.BOX_OFFICE_CLOSED,
            },
          };
        }),
        openBoxOffice: assign(context => {
          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
              status: ShowStatus.BOX_OFFICE_OPEN,
            },
          };
        }),
        cancelShow: assign(context => {
          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
              status: ShowStatus.CANCELLED,
            },
          };
        }),
        startShow: assign(context => {
          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
              status: ShowStatus.STARTED,
              startDate: new Date().getTime(),
            },
          };
        }),
        endShow: assign(context => {
          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
              status: ShowStatus.ENDED,
              endDate: new Date().getTime(),
            },
          };
        }),
        requestCancellation: assign((context, event) => {
          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
              status: ShowStatus.CANCELLATION_REQUESTED,
              ticketsAvailable: 0,
              cancel: event.cancel,
            },
          };
        }),
        sendRefund: assign((context, event) => {
          // Check if this is full refund for a ticket
          const ticketsRefunded = context.showState.ticketsRefunded + 1;

          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
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
        saveShowState: context => {
          if (saveShowStateCallback) saveShowStateCallback(context.showState);
        },
        incrementTicketsAvailable: assign(context => {
          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
              ticketsAvailable: context.showState.ticketsAvailable + 1,
              ticketsReserved: context.showState.ticketsReserved - 1,
            },
          };
        }),
        decrementTicketsAvailable: assign(context => {
          return {
            showState: {
              ...context.showState,
              updatedAt: new Date().getTime(),
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
              updatedAt: new Date().getTime(),
              ticketsSold: state.ticketsSold + 1,
              ticketsReserved: context.showState.ticketsReserved - 1,
              totalSales: state.totalSales + +event.transaction.value,
              transactions: state.transactions
                ? [...state.transactions, event.transaction._id]
                : [event.transaction._id],
            },
          };
        }),
      },
      guards: {
        canCancel: context =>
          context.showState.ticketsSold === 0 &&
          context.showState.ticketsReserved === 0,
        showCancelled: context =>
          context.showState.status === ShowStatus.CANCELLED,
        showFinalized: context =>
          context.showState.status === ShowStatus.FINALIZED,
        showInDispute: context =>
          context.showState.status === ShowStatus.IN_DISPUTE,
        showInEscrow: context =>
          context.showState.status === ShowStatus.IN_ESCROW,
        showRequestedCancellation: context =>
          context.showState.status === ShowStatus.CANCELLATION_REQUESTED,
        showBoxOfficeOpen: context =>
          context.showState.status === ShowStatus.BOX_OFFICE_OPEN,
        showBoxOfficeClosed: context =>
          context.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
        showStarted: context => context.showState.status === ShowStatus.STARTED,
        showEnded: context => context.showState.status === ShowStatus.ENDED,
        soldOut: context => context.showState.ticketsAvailable === 1,
        canStartShow: context => context.showState.ticketsSold > 0,
        fullyRefunded: (context, event) => {
          const value =
            event.type === 'REFUND SENT' ? event.transaction?.value : 0;
          return (
            context.showState.refundedAmount + +value >=
            context.showState.totalSales
          );
        },
      },
    }
  );
};

export const createShowMachineService = ({
  showState,
  saveShowStateCallback,
}: {
  showState: ShowStateType;
  saveShowStateCallback?: ShowStateCallbackType;
}) => {
  const showMachine = createShowMachine({ showState, saveShowStateCallback });
  return interpret(showMachine).start();
};

export type ShowMachineType = ReturnType<typeof createShowMachine>;
export type ShowMachineStateType = StateFrom<typeof createShowMachine>;
export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;

import { PUBLIC_ESCROW_PERIOD } from '$env/static/public';
import type { ShowDocType } from '$lib/ORM/models/show';
import { ShowStatus } from '$lib/ORM/models/show';
import type { TicketDocType } from '$lib/ORM/models/ticket';
import { TicketStatus } from '$lib/ORM/models/ticket';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

type TicketStateType = TicketDocType['ticketState'];
type ShowStateType = ShowDocType['showState'];
const PAYMENT_PERIOD = +PUBLIC_ESCROW_PERIOD || 3600000;
const GRACE_PERIOD = +PUBLIC_ESCROW_PERIOD || 900000;

export type TicketStateCallbackType = (state: TicketStateType) => void;

export const paymentTimer = (timerStart: number) => {
  const timer = timerStart + PAYMENT_PERIOD - new Date().getTime();
  return timer > 0 ? timer : 0;
};

export const createTicketMachine = ({
  ticketState,
  showState,
  saveTicketStateCallback,
}: {
  ticketState: TicketStateType;
  showState: ShowStateType;
  saveTicketStateCallback?: TicketStateCallbackType;
}) => {
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAdGljgAQA2A9vhJAMQDaADALqKgAHRrFRpGpfiAAeiAEwBGLhVkBmACwqA7AFYANCACeiAGzHtFAJxcLW7QF87+6tjyES5KhhcNmrCJ3k+JBAhETEJYJkEeStldVt9IwQADnkKe0cQZxwCYjJKbOQfFnYOWSDBYVFUcUkozVlEuTU1Y0tZDKcvHLd8zxoiphL-DhUKkKrwurlFOI0dJuiLGIp5HQcugdz3Au7B31K1cdDq2si5LiVVeb1DOW1ZdI2sve2+wuK-Tm1jyZqI0BRB6LWSaeQqChqbSKNTyUzw4yaZ6FN4eD5DL4cYy-ML-aZLK7xBZ3BAKbRtCwdZGvXoeABOcDAdIAbpAKAB3fDVUhQNQABXwBgAtmBSMg2HyAIIATVwAFEAHIAFVoACU5QBhOUASQAanKACLcHGnAHSRDJUwUMzGDqLNSaCHaLgqeSyNQWT1eiydF5bWmUBmwJmsiAcrloHn8wUisUSmXy5VqzU6-VGwKSE5Tc7RS6aSxcW23JJaeTU-15emMllsznc3kC4Wi8XqgCKAFU5QBlFUayUKrUAGUHkqV2oA8grjZm-mdAYh5M7zApksSkvI4UoVMltDZ1pkUQGKEGQ7WI2QGzHm2w252e7Q+wO5cPRxOpxnglm8TntMk1OlFmSH1lELKkDxpStA2rUNw3raMmzjadP1nM0oktNobTtEk1FBdIXTdD1vU9X1D0g49oLPOCuyIRh2RvOUO27Xt+yHEcx0nJDKlxOdzWiJdlHkVdiwXFRrGUKFXTAzYXFRKDgxrMM60jXlqNo+jGPvR9WNfDiPy4018QafNFD3YTohUUSKFdckpL9GSjxPBTYOUtRVLogB1UcNQACVoLtvPHdzOImbjUIXfiVzXBcPWSCguEE-dpJ6MjHJghkAEcAFc4GQSANXwUh0DAeh6HwcJnIvNRVTAAAzTLSH8dUADF2wVA1ky1PVDWCr8eKiRcuGXBKzNkS5y3slKKLDDLstgXKIHywritK8qlMq6q6oa+iWrajrU26vSQoMnMN3dCggNAsybAhNRrFscbkp2cjIDAEV-EHOVJX1PyAqC3gZ1C-FRs0f9jDWYbFkEsH2hIiCnoZF63rYTylR8n7Ap6lCgcuWKEhJQSN0hWzSPhsBEfYfzAtoRUDW6-7kMBnNbRBXc0i4FpNGWBFTCRcCKyesg5VgdA6TUpq5UNAAhSUNQAaT2rqjXp-Ts3nBAVBsCgotJclzBw2H+b6QXhdFuiDW1Ls+XbJU5VobUFW1MdRzpk1Vd4jWIW10Fbq1+7nlIRhWHgYISfyAHjrVgBaYxFmjh7XDI9EDggcO3aiHDIeMZZVkSuzHr6VLIFT781YeNIRuSJ149k8j5Jgtao0bWNkGLvqTEXVYVFkVIsKSGLIUu6uHKmiqozc1uwoQckLAA-GHn-P9jCEofJrrtkZpyvKCqKkqypLo604XLhNDaC6i0AqEC1MlfSbX6awCyzeFu35a9-EUfeQ2+qU4ZiPeI3YCag-x43XIWJQqQbIGwmqTcmP8Vb736poEGkJtYxDWETKB+cPDoBfiVIuv9D7RGSDuRYlIrI3z6DVMg+B6CoAAF74PgW3BAYMIQWGAV7KE5cubc3hLzJKCcBakCFiLWiE8gaOmtHdL2xh1BawdDw7m-C86CKNqQA0qBYACEyrlcRP4LD5kRBDEkoI-yQlukWBwDggA */
  return createMachine(
    {
      context: {
        ticketState,
        showState,
        errorMessage: undefined as string | undefined,
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
              type: 'WATCH SHOW';
            }
          | {
              type: 'LEAVE SHOW';
            }
          | {
              type: 'SHOW ENDED';
            },
      },
      predictableActionArguments: true,
      id: 'ticketMachine',
      initial: 'ticket loaded',
      states: {
        'ticket loaded': {
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
              always: {
                target: 'waiting4Show',
                cond: 'fullyPaid',
              },
              on: {
                'PAYMENT RECEIVED': [
                  {
                    target: 'waiting4Show',
                    cond: 'fullyPaid',
                    actions: ['receivePayment', 'saveTicketState'],
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
                    ],
                  },
                  {
                    target: '#ticketMachine.reserved.requestedCancellation',
                    actions: ['requestCancellation', 'saveTicketState'],
                  },
                ],
                'WATCH SHOW': {
                  target: '#ticketMachine.reedemed',
                  cond: 'canWatchShow',
                  actions: ['redeemTicket', 'saveTicketState'],
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
            'LEAVE SHOW': {},
            'WATCH SHOW': { cond: 'canWatchShow' },
            'SHOW ENDED': {
              target: '#ticketMachine.inEscrow',
              actions: ['enterEscrow', 'saveTicketState'],
            },
          },
        },
        cancelled: {
          type: 'final',
        },
        finalized: {
          type: 'final',
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
    },
    {
      actions: {
        saveTicketState: context => {
          if (saveTicketStateCallback)
            saveTicketStateCallback(context.ticketState);
        },

        requestCancellation: assign((context, event) => {
          return {
            ticketState: {
              ...context.ticketState,
              updatedAt: new Date().getTime(),
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
              updatedAt: new Date().getTime(),
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
              updatedAt: new Date().getTime(),
              status: TicketStatus.CANCELLED,
            },
          };
        }),

        receivePayment: assign((context, event) => {
          const state = context.ticketState;
          return {
            ticketState: {
              ...context.ticketState,
              updatedAt: new Date().getTime(),
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
              updatedAt: new Date().getTime(),
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
              updatedAt: new Date().getTime(),
              feedback: event.feedback,
            },
          };
        }),

        initiateDispute: assign((context, event) => {
          return {
            ticketState: {
              ...context.ticketState,
              updatedAt: new Date().getTime(),
              status: TicketStatus.IN_DISPUTE,
              dispute: event.dispute,
            },
          };
        }),

        enterEscrow: assign(context => {
          return {
            ticketState: {
              ...context.ticketState,
              updatedAt: new Date().getTime(),
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
                updatedAt: new Date().getTime(),
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
          console.log(JSON.stringify(context));
          return (
            context.ticketState.totalPaid <=
              context.ticketState.refundedAmount &&
            context.showState.status !== ShowStatus.STARTED
          );
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
          return (
            context.ticketState.totalPaid >= context.ticketState.price &&
            context.showState.status === ShowStatus.STARTED
          );
        },
      },
    }
  );
};

export const createTicketMachineService = ({
  ticketState,
  showState,
  saveTicketStateCallback,
}: {
  ticketState: TicketStateType;
  showState: ShowStateType;
  saveTicketStateCallback?: TicketStateCallbackType;
}) => {
  const ticketMachine = createTicketMachine({
    ticketState,
    showState,
    saveTicketStateCallback,
  });
  return interpret(ticketMachine).start();
};

export type ticketMachineType = ReturnType<typeof createTicketMachine>;
export type ticketMachineStateType = StateFrom<typeof createTicketMachine>;
export type ticketMachineServiceType = ReturnType<
  typeof createTicketMachineService
>;

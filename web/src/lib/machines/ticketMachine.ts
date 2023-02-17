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
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAdGljgAQA2A9vhJAMQDaADALqKgAHRrFRpGpfiAAeiAEwBGLhVkBmACwqA7AFYANCACeiAGzHtFAJxcLW7QF87+6tjyES5KhhcNmrCJ3k+JBAhETEJYJkEeStldVt9IwQADnkKe0cQZxwCYjJKbOQfFnYOWSDBYVFUcUkozVlEuTU1Y0tZDKcvHLd8zxoiphL-DhUKkKrwurlFOI0dJuiLGIp5HQcugdz3Au7B31K1cdDq2si5LiVVeb1DOW1ZdI2sve2+wuK-Tm1jyZqI0BRB6LWSaeQqChqbSKNTyUzw4yaZ6FN4eD5DL4cYy-ML-aZLK7xBZ3BAKbRtCwdZGvXoeABOcDAdIAbpAKAB3fDVUhQNQABXwBgAtmBSMg2HyAIIATVwAFEAHIAFVoACU5QBhOUASQAanKACLcHGnAHSRDJUwUMzGDqLNSaCHaLgqeSyNQWT1eiydF5bWmUBmwJmsiAcrloHn8wUisUSmXy5VqzU6-VGwKSE5Tc7RS6aSxcW23JJaeTU-15emMllsznc3kC4Wi8XqgCKAFU5QBlFUayUKrUAGUHkqV2oA8grjZm-mdAYh5M7zApksSkvI4UoVMltDZ1pkUQGKEGQ7WI2QGzHm2w252e7Q+wO5cPRxOpxnglm8TntMk1OlFmSH1lELKkDxpStA2rUNw3raMmzjadP1nM0oktNobTtEk1FBdIXTdD1vU9X1D0g49oLPOCuyIRh2RvOUO27Xt+yHEcx0nJDKlxOdzWiJdlHkVdiwXFRrGUKFXTAzYXFRKDgxrMM60jXlqNo+jGPvR9WNfDiPy4018QafNFD3YTohUUSKFdckpL9GSjxPBTYOUtRVLogB1UcNQACVoLtvPHdzOImbjUIXfiVzXBcPWSCguEE-dpJ6MjHJghkAEcAFc4GQSANXwUh0DAeh6HwcJnIvNRVTAAAzTLSH8dUADF2wVA1ky1PVDWCr8eKiRcuGXBKzNkS5y3slKKLDDLstgXKIHywritK8qlMq6q6oa+iWrajrU26vSQoMnMN3dCggNAsybAhNRrFscbkp2cjIDAEV-EHOVJX1PyAqC3gZ1C-FRs0f9jDWYbFkEsH2hIiCnoZF63rYTylR8n7Ap6lCgcuWKEhJQSN0hWzSPhsBEfYfzAtoRUDW6-7kMBnNbRBXc0i4FpNGWBFTCRcCKyesg5VgdA6TUpq5UNAAhSUNQAaT2rqjXp-Ts3nBAVBsCgotJclzBw2H+b6QXhdFuiDW1Ls+XbJU5VobUFW1MdRzpk1Vd4jWIW10Fbq1+7nlIRhWHgYISfyAHjrVgBaYxFmjh7XDI9EDggcO3aiHDIeMZZVkSuzHr6VLIFT781YeNIRuSJ149k8j5Jgtao0bWNkGLvqTEXVYVFkVIsKSGLIUu6uHKmiqozc1uwoQckLAA-GHn-P9jCEofJrrtkZpyvKCqKkqypLo604XLhNDaC6i0AqEC1MlfSbX6awCyzeFu35a9-EUfeQ2+qU4ZiPeI3YCag-x43XIWJQqQbIGwmqTcmP8Vb736poEGkJtYxDWETKB+cPDoBfiVIuv9D7RGSDuRYlIrI3z6DVMg+B6CoAAF74PgW3BAYMIQWGAV7KE5cubc3hLzJKCcBakCFiLWiE8gaOmtHdL2xh1BawdDw7m-C86CKNqQA0qBYACEyrlcRP4LD5kRBDEkoI-yQlukWBwDggA */
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
              type: 'SHOWSTATE UPDATE';
              showState: ShowStateType;
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
              always: {
                target: 'waiting4Show',
                cond: 'fullyPaid',
              },
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
          const state = context.showMachineRef?.getSnapshot();
          const canCancel =
            context.ticketState.totalPaid <=
              context.ticketState.refundedAmount &&
            state !== undefined &&
            state.can({
              type: 'TICKET CANCELLED',
              ticket: context.ticketDocument,
            });

          return canCancel;
        },
        canRequestCancellation: context => {
          const state = context.showMachineRef?.getSnapshot();
          const canRequestCancellation =
            state !== undefined &&
            state.can({
              type: 'TICKET CANCELLED',
              ticket: context.ticketDocument,
            });
          return canRequestCancellation;
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

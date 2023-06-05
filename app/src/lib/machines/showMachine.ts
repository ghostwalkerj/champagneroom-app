/* eslint-disable @typescript-eslint/naming-convention */
import { ActorType } from '$lib/constants';
import type {
  ShowDocumentType,
  ShowRefundType,
  ShowSaleType,
} from '$lib/models/show';
import { ShowStatus } from '$lib/models/show';
import type { TicketDocumentType } from '$lib/models/ticket';
import type { TransactionDocumentType } from '$lib/models/transaction';
import type { ShowJobDataType } from '$lib/workers/showWorker';
import type { Queue } from 'bullmq';
import { nanoid } from 'nanoid';
import type { exit } from 'process';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import { raise } from 'xstate/lib/actions';

export type ShowStateType = ShowDocumentType['showState'];

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

export enum ShowMachineEventString {
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
}

export type ShowMachineEventType =
  | {
      type: 'CANCELLATION INITIATED';
      cancel: ShowStateType['cancel'];
    }
  | {
      type: 'FEEDBACK RECEIVED';
      ticket: TicketDocumentType;
    }
  | {
      type: 'REFUND INITIATED';
    }
  | {
      type: 'TICKET REFUNDED';
      ticket: TicketDocumentType;
      transactions: TransactionDocumentType[];
      requestedBy: ActorType;
      refundedAt?: Date;
      amount: number;
    }
  | {
      type: 'TICKET RESERVED';
      ticket?: TicketDocumentType;
    }
  | {
      type: 'TICKET RESERVATION TIMEOUT';
      ticket: TicketDocumentType;
    }
  | {
      type: 'TICKET CANCELLED';
      ticket: TicketDocumentType;
    }
  | {
      type: 'TICKET SOLD';
      ticket: TicketDocumentType;
      transactions: TransactionDocumentType[];
      soldAt?: Date;
      amount: number;
    }
  | {
      type: 'SHOW STARTED';
    }
  | {
      type: 'SHOW STOPPED';
    }
  | {
      type: 'SHOW FINALIZED';
      finalize: ShowStateType['finalize'];
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
    };

export const createShowMachine = ({
  showDocument,
  showMachineOptions,
}: {
  showDocument: ShowDocumentType;
  showMachineOptions?: ShowMachineOptions;
}) => {
  const GRACE_PERIOD = showMachineOptions?.gracePeriod || 3_600_000;
  const ESCROW_PERIOD = showMachineOptions?.escrowPeriod || 3_600_000;

  /** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAYgGUAJAeQHUKAVAQUYFEACAVQAUARVmwDaABgC6iUAAc0sQgBdCaYpJAAPRABYATABoQAT0QBOAOzGAdAGYArDavGrpgBwjNx4wEYAvt-2pMXAISMAsAjAAZNBwISDJRCSQQGTlFZVUNBBtjEWtNK2crERFTbRttR30jBE9izWsrT0dTN2NC0xtff3RsfCJSMJ6omLihT0TpWQUlFSTM7NyrfMLi0vLKw0RPTWyLdvKANk8Djs0RKy6QcKD+0PDh2Ih47QnkqbTZ0HmcvIKikrKFSsVUQpUsnk8NgOIkcmk82mcpk0l2ufRCg0wD1GVleKWm6TmiBsrl+KwB62BmxqxIODQ6ZXO5lKKJ6N3R92ij3imlx7xmGSJeipjQRFk0zhs5ysRWOOVMLMCaIGHJGTyENl5qX5hKyJKWf1WgI21TKlmKBwqkOcELaB2RfiurKVdyGnNGB01+M+6iJLVJ-zWQJBNVFkuKtWcOk0plqBwVvWCAwARmg1DQAGbpwh4MA0KRgYhkABKbAAilw2EwOABhZgAOWrbAiEVYAEkaHWEqo8R8BTU7c4LAdnMPTB1su5tAdg55CjYLCVh5HtJ4-pH42zk6mM1mc3mC8WyxWq7WG02W4x253xt2+QSvlsB0OR4jx8ZJ9OqdtRU0Cq5Z642giHGDqoomoQpmmmbZrm+aFpe1YANJsIwHAlhQbBFgAamwfBdkkPbag+NRuLS7hmB45yeKYRSftUELaNoeyNO+EJuDGXgbs6FiQTuMH7vBrZIShaGVphOF4TeBF3t6mRNJo9Q5DYNHbNsNj5JoM7SqYFjaGcErlDshRNFx4E8du0F7nBZAIchqHoeJbYdhwl5YGwNBcIw+GTFq94+jUxjlHsTQqaUMbrDOK71IUOwlK4xRWNoFygU6Zm8ZZsEHrZImno2za4d5by+bJWxtPOBwOMYBxtFVJzijOMJMTo1rQrYOiJfKKWKmlFm7plgnCahFA0BEeHiLexV9kBxzWDkIhTtRbS2JS1RmLk80AaO5TFM4pm3OZUF9QJlAsEWQ20HQhWEX5clQlYYruKUO0lHCmlUvY9RAaxf4OOcu1dQm+3pUd1nZfZbAAGJcHWfAFeN0mTTqQHFBY9hzkczg5Apb3VJGOlHFCq4OEcw4gd03VA71MHVgANrIcRMMwZ0cNQ9BXTJfa1G4YqzicwHuDoNjBk4OmShagUVdC5j-eTgPosD1N07AcRg6JGHYU5dYua2bkeV58M+V6nOkWKHjmDkjQ0cBkUxkOXgsQpHSmGTjoU-LVM5rT9NPKruXnnDnq9jqtRQqbFEW9RtEzjouR2MBZjmG40p7e7h2K97NlCXZLMjWNgdEf5q67Aizil24IiSvCONbNpFiOBChRLNswEp1uaee0rKtZyJJZQzDAcTUbwf6mKTi2DFY5QpFkKo3pS3OJacLJbLm4QR7YBe8rTwluWlaoX7zaa+ziPEbUmhkWblGW1HVLI-O5rKdKEpTp1K-cQrHcZzvx77-WeUXleMY+cbpbArhfcOVErZ0S2MSaKZh4QuDHKOF2YF9qwHkDgAATvIBmp1zpswNkVIexEX5MWAksE4FokSlyFlSZYddgJ6QhEgq0rc7gYOwXEasXAmA0DckWDgAApGgrY6wDwRsQ-yU57DWHKGjbQ45SjCx0HXew2wDjrGospNhYQOE4KeNw3h-COAREhvrYBJUEBTgtHsBS6koRuC0cGPSOlijhnFGYWwjFl6uzlsqPRcQ2AwxZhdY+kjMjGCFCaO0TEFGMQ8JHSJycAarwsAWLkjNmas0uoQ66ljahRMQGUJoewNGBWogiKuOj0kMwuhwCGojmARFbAALXEYbIOxEnCeD2AidwI4FFm1XM4iqTE7RgkCmYGw8IdGYLAAARwAK5wH0dWHAxAcw0xpjgD4FgMA4GmMQKA2gixgHTIs4gPtu7gz7rDPOg9OlSLAWKYctQvANzsDOaEg4uaMWdk-bQsyFnLPQZANZGywBbJ2TMPZBzFBHJOWci5VzBo1j-v7e5EjHmZAXs4529QTgjnPkcMwSVfAOmIGgWI8AkioJCA8gumQAC00CEBMvnB4TlXLOVjh8XS5UrpVQMpAQgdqYoVyl2qo0CqY5q4kXmqja0WMqoSghJ0FJ3E8DrM2TTSAwrLH6T2DkKhiUHBNAOKyoEPSyoiDUsccMgKNVmSzMQHANNCAAC89VYsZYgCq4IYReIUklcpwt44WEhMcO0zdoR6R0R-fq+rOZwjGWcSENFsjE1MNHO0Q5owV2jMSGEdp43r03t6jpvqEAjlyBK6ZxxrQFHPjm+c2l7BxSetop1aCAkQCTcHGhexzBTkiU9J+wYoS0hFNM8+k7owoNSvtGpfafUioUdayMVCkQsQlCtIpFqA3sThCcYkSIgVLJWWC7VkLtmPLyVNHaLzrQwghLOT5X5tpDnDLaDqOwF1uwGHMi9oKIDgp1dC5QsLDnHNOecy5-aSElFjpPDRAyPDvvohm1GwFlKSnMCS5KvggA */
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
                target: 'finalized',
                actions: [
                  'receiveFeedback',
                  raise({
                    type: 'SHOW FINALIZED',
                    finalize: {
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
            ticket: event.ticket,
          });
        },

        refundTicket: assign((context, event) => {
          const st = context.showState;
          const ticketsRefunded = st.salesStats.ticketsRefunded + 1;
          const ticketsSold = st.salesStats.ticketsSold - 1;
          const totalRefunded = st.salesStats.totalRefunded + event.amount;
          const totalRevenue = st.salesStats.totalRevenue - event.amount;

          const refund = {
            refundedAt: event.refundedAt || new Date(),
            transactions: event.transactions.map(t => t._id),
            ticket: event.ticket._id,
            amount: event.amount,
          } as ShowRefundType;
          st.refunds.push(refund);

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

        enterEscrow: assign((context, event) => {
          showMachineOptions?.jobQueue?.add(
            event.type,
            {
              showId: context.showDocument._id.toString(),
            },
            { delay: +ESCROW_PERIOD }
          );
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.IN_ESCROW,
              escrow: {
                startDate: new Date(),
              },
            },
          };
        }),

        exitEscrow: assign(context => {
          if (!context.showState.escrow) return {};
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.IN_ESCROW,
              escrow: {
                startDate: context.showState.escrow.startDate,
                endDate: new Date(),
              },
            },
          };
        }),

        deactivateShow: assign(context => {
          return {
            showState: {
              ...context.showState,
              activeState: false,
              current: false,
            },
          };
        }),

        makeShowNotCurrent: assign(context => {
          return {
            showState: {
              ...context.showState,
              current: false,
            },
          };
        }),

        incrementTicketsAvailable: assign(context => {
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

        decrementTicketsAvailable: assign(context => {
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
          const ticketsSold = st.salesStats.ticketsSold + 1;
          const ticketsReserved = st.salesStats.ticketsReserved - 1;
          const totalSales = st.salesStats.totalSales + event.amount;
          const totalRevenue = st.salesStats.totalRevenue + event.amount;

          const sale = {
            soldAt: event.soldAt || new Date(),
            transactions: event.transactions.map(t => t._id),
            ticket: event.ticket._id,
            amount: event.amount,
          } as ShowSaleType;
          st.sales.push(sale);

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
            (context.showState.runtime?.endDate
              ? Date.now() - context.showState.runtime.endDate.getTime()
              : 0);
          return delay > 0 ? delay : 0;
        },
      },

      guards: {
        canCancel: context =>
          context.showState.salesStats.ticketsSold -
            context.showState.salesStats.ticketsRefunded ===
          0,
        showCancelled: context =>
          context.showState.status === ShowStatus.CANCELLED,
        showFinalized: context =>
          context.showState.status === ShowStatus.FINALIZED,
        showInitiatedCancellation: context =>
          context.showState.status === ShowStatus.CANCELLATION_INITIATED,
        showInitiatedRefund: context =>
          context.showState.status === ShowStatus.REFUND_INITIATED,
        showBoxOfficeOpen: context =>
          context.showState.status === ShowStatus.BOX_OFFICE_OPEN,
        showBoxOfficeClosed: context =>
          context.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
        showStarted: context => context.showState.status === ShowStatus.LIVE,
        showStopped: context => context.showState.status === ShowStatus.STOPPED,
        showInEscrow: context =>
          context.showState.status === ShowStatus.IN_ESCROW,
        soldOut: context => context.showState.salesStats.ticketsAvailable === 1,
        canStartShow: context => {
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
          const feedback = event.type === 'FEEDBACK RECEIVED' ? 1 : 0;
          return (
            context.showState.feedbackStats.totalReviews + feedback ===
            context.showState.salesStats.ticketsSold
          );
        },
      },
    }
  );
};

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
    showService.onChange(context => {
      showMachineOptions.saveStateCallback &&
        showMachineOptions.saveStateCallback(context.showState);
    });
  }

  if (showMachineOptions?.saveShowEventCallback) {
    showService.onEvent(event => {
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

export type ShowMachineType = ReturnType<typeof createShowMachine>;
export type ShowMachineStateType = StateFrom<typeof createShowMachine>;
export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;

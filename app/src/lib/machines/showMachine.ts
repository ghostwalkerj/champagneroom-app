import { PUBLIC_ESCROW_PERIOD, PUBLIC_GRACE_PERIOD } from '$env/static/public';
import type {
  ShowDocType,
  ShowRefundType,
  ShowSaleType,
} from '$lib/models/show';
import { ShowStatus } from '$lib/models/show';
import type { TicketDocType } from '$lib/models/ticket';
import type { TransactionDocType } from '$lib/models/transaction';
import type { ActorType } from '$lib/util/constants';
import type { Queue } from 'bullmq';
import { nanoid } from 'nanoid';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

export type ShowStateType = ShowDocType['showState'];

export type ShowMachineOptions = {
  saveStateCallback?: (state: ShowStateType) => void;
  saveShowEventCallback?: ({
    type,
    ticket,
    transaction,
  }: {
    type: string;
    ticket?: TicketDocType;
    transaction?: TransactionDocType;
  }) => void;
  jobQueue?: Queue;
  gracePeriod?: number;
  escrowPeriod?: number;
};

export type ShowMachineEventType =
  | {
      type: 'CANCELLATION INITIATED';
      cancel: ShowStateType['cancel'];
    }
  | {
      type: 'REFUND INITIATED';
    }
  | {
      type: 'TICKET REFUNDED';
      ticket: TicketDocType;
      transactions: TransactionDocType[];
      requestedBy: ActorType;
      refundedAt?: Date;
      amount: number;
    }
  | {
      type: 'TICKET RESERVED';
      ticket?: TicketDocType;
    }
  | {
      type: 'TICKET RESERVATION TIMEOUT';
      ticket: TicketDocType;
    }
  | {
      type: 'TICKET CANCELLED';
      ticket: TicketDocType;
    }
  | {
      type: 'TICKET SOLD';
      ticket: TicketDocType;
      transactions: TransactionDocType[];
      soldAt?: Date;
      amount: number;
    }
  | {
      type: 'START SHOW';
    }
  | {
      type: 'STOP SHOW';
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
      ticket: TicketDocType;
    }
  | {
      type: 'CUSTOMER LEFT';
      ticket: TicketDocType;
    };

export const createShowMachine = ({
  showDocument,
  showMachineOptions,
}: {
  showDocument: ShowDocType;
  showMachineOptions?: ShowMachineOptions;
}) => {
  const GRACE_PERIOD = showMachineOptions?.gracePeriod || 3600000;

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
          tags: ['canCreateShow'],
          entry: ['deactivateShow'],
        },
        inEscrow: {
          tags: ['canCreateShow'],
          entry: ['enterEscrow'],
          exit: ['exitEscrow'],
          on: {
            'SHOW FINALIZED': {
              target: 'finalized',
              actions: ['finalizeShow'],
            },
          },
        },
        finalized: {
          type: 'final',
          tags: ['canCreateShow'],
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
            'START SHOW': {
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
            'START SHOW': {
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
            'START SHOW': {
              actions: ['startShow'],
            },
            'CUSTOMER JOINED': {},
            'CUSTOMER LEFT': {},
            'STOP SHOW': {
              target: 'stopped',
              actions: ['stopShow'],
            },
          },
        },
        stopped: {
          on: {
            'START SHOW': {
              target: 'started',
              actions: ['startShow'],
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
                    actions: ['cancelShow'],
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

        endShow: assign(context => {
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
              showId: context.showDocument._id,
            },
            { delay: +PUBLIC_GRACE_PERIOD }
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
            showId: context.showDocument._id,
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
            showId: context.showDocument._id,
          });
          return {
            showState: {
              ...context.showState,
              status: ShowStatus.REFUND_INITIATED,
            },
          };
        }),
        refundTicket: assign((context, event) => {
          const st = context.showState;
          const ticketsRefunded = st.salesStats.ticketsRefunded + 1;
        
          const refundedAmount = st.salesStats.totalRefunded + event.amount;
          const refund = {
            refundedAt: event.refundedAt || new Date(),
            transactions: event.transactions.map(t => t._id),
            ticket: event.ticket._id,
            amount: event.amount,
          } as ShowRefundType;
          st.refunds.push(refund);

          return {
            showState: {
              ...context.showState,
              ticketsRefunded,
              refundedAmount,
            },
          };
        }),

        enterEscrow: assign((context, event) => {
          showMachineOptions?.jobQueue?.add(
            event.type,
            {
              showId: context.showDocument._id,
            },
            { delay: +PUBLIC_ESCROW_PERIOD }
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
              active: false,
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
          const totalSales = st.salesStats.totalSales + +event.amount;

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
              ? new Date().getTime() -
                context.showState.runtime.endDate.getTime()
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
              new Date().getTime()
            );
          }
          return (
            context.showState.salesStats.ticketsSold -
              context.showState.salesStats.ticketsAvailable >
            0
          );
        },
        fullyRefunded: context => {
          return (
            context.showState.salesStats.totalRefunded >=
            context.showState.salesStats.totalSales
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
  showDocument: ShowDocType;
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
        | TicketDocType
        | undefined;
      const transaction = (
        'transaction' in event ? event.transaction : undefined
      ) as TransactionDocType | undefined;
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

/* eslint-disable @typescript-eslint/naming-convention */
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { nanoid } from 'nanoid';
import {
  type AnyEventObject,
  assign,
  createActor,
  setup,
  type SnapshotFrom,
  type StateFrom
} from 'xstate';

import {
  type CancelType,
  escrowSchema,
  type FinalizeType,
  runtimeSchema
} from '$lib/models/common';
import type { ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import type { TransactionDocument } from '$lib/models/transaction';

import type { ShowQueueType, ShowWorkerJobType } from '$lib/workers/showWorker';

import { DisputeDecision, EntityType, ShowStatus } from '$lib/constants';

export type ShowActorType = ReturnType<typeof createShowActor>;

//#region Event Types
export type ShowMachineEventType =
  | {
      type: 'CANCELLATION INITIATED';
      cancel: CancelType;
    }
  | {
      type: 'TICKET FINALIZED';
      ticket: TicketDocument;
    }
  | {
      type: 'REFUND INITIATED';
    }
  | {
      type: 'TICKET REFUNDED';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET REDEEMED';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET RESERVED';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET CANCELLED';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET SOLD';
      ticket: TicketDocument;
    }
  | {
      type: 'SHOW STARTED';
    }
  | {
      type: 'SHOW STOPPED';
    }
  | {
      type: 'SHOW FINALIZED';
      finalize: FinalizeType;
    }
  | {
      type: 'SHOW ENDED';
    }
  | {
      type: 'CUSTOMER JOINED';
      ticket: TicketDocument;
    }
  | {
      type: 'CUSTOMER LEFT';
      ticket: TicketDocument;
    }
  | {
      type: 'TICKET DISPUTED';
      ticket: TicketDocument;
    }
  | {
      type: 'DISPUTE DECIDED';
      ticket: TicketDocument;
      decision: DisputeDecision;
    };

//#endregion
export type ShowMachineInput = {
  show: ShowDocument;
  redisConnection: IORedis;
  options?: Partial<ShowMachineOptions>;
};

export type ShowMachineOptions = {
  gracePeriod: number;
  escrowPeriod: number;
};

type ShowMachineContext = {
  show: ShowDocument;
  id: string;
  errorMessage?: string;
  options: ShowMachineOptions;
  showQueue: ShowQueueType;
};

export type ShowMachineServiceType = ReturnType<
  typeof createShowMachineService
>;
export type ShowMachineSnapshotType = SnapshotFrom<typeof showMachine>;

const createShowEvent = (show: ShowDocument, event: AnyEventObject) => {
  let customerName = 'someone';
  let ticketId = '';
  console.log('Creating show event', event);
  if ('ticket' in event) {
    const ticket = event.ticket as TicketDocument;
    ticketId = ticket._id.toString();
    customerName = ticket.user.name;
  } else if ('customerName' in event) {
    customerName = event.customerName as string;
  }
  const transaction = (
    'transaction' in event ? event.transaction : undefined
  ) as TransactionDocument | undefined;
  const ticketInfo = { customerName };
  show.saveShowEvent(event.type, ticketId, transaction, ticketInfo);
};

export type ShowMachineStateType = StateFrom<typeof showMachine>;

export type ShowMachineType = typeof showMachine;

export const createShowActor = (input: ShowMachineInput) => {
  return createActor(showMachine, {
    input,
    inspect: (inspectionEvent) => {
      if (
        inspectionEvent.type === '@xstate.event' &&
        inspectionEvent.event.type !== 'xstate.init' &&
        inspectionEvent.event.type !== 'xstate.stop'
      )
        createShowEvent(input.show, inspectionEvent.event);
    }
  });
};

export const createShowMachineService = (input: ShowMachineInput) => {
  return createShowActor(input).start();
};

export const showMachine = setup({
  types: {
    events: {} as ShowMachineEventType,
    context: {} as ShowMachineContext,
    input: {} as ShowMachineInput
  },
  actions: {
    closeBoxOffice: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const show = params.show;
        show.showState.status = ShowStatus.BOX_OFFICE_CLOSED;
        return {
          show
        };
      }
    ),

    openBoxOffice: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const show = params.show;
        show.showState.status = ShowStatus.BOX_OFFICE_OPEN;
        return {
          show
        };
      }
    ),

    cancelShow: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const show = params.show;
        show.showState.status = ShowStatus.CANCELLED;
        return {
          show
        };
      }
    ),

    startShow: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const show = params.show;
        show.showState.status = ShowStatus.LIVE;
        show.showState.runtime = runtimeSchema.parse({
          startDate: new Date()
        });
        return {
          show
        };
      }
    ),

    endShow: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const show = params.show;
        show.showState.status = ShowStatus.ENDED;
        show.showState.escrow = escrowSchema.parse({});
        show.showState.current = false;
        return {
          show
        };
      }
    ),

    queueShowJob: (
      _,
      params: {
        show: ShowDocument;
        showQueue: ShowQueueType;
        jobType: ShowWorkerJobType;
      }
    ) => {
      params.showQueue.add(params.jobType, {
        showId: params.show._id.toString()
      });
    },

    queueCancelTickets: (
      _,
      params: {
        show: ShowDocument;
        cancel: CancelType;
        showQueue: ShowQueueType;
      }
    ) => {
      params.showQueue.add('CANCEL TICKETS', {
        showId: params.show._id.toString(),
        cancel: params.cancel
      });
    },

    stopShow: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const show = params.show;
        const startDate = show.showState.runtime?.startDate;
        if (!startDate) {
          throw new Error('Show start date is not defined');
        }
        show.showState.status = ShowStatus.STOPPED;
        show.showState.runtime = runtimeSchema.parse({
          startDate,
          endDate: new Date()
        });
        return { show };
      }
    ),

    initiateCancellation: assign(
      (
        _,
        params: {
          show: ShowDocument;
          cancel: CancelType;
        }
      ) => {
        const show = params.show;
        show.showState.status = ShowStatus.CANCELLATION_INITIATED;
        show.showState.cancel = params.cancel;
        show.showState.salesStats.ticketsAvailable = 0;
        return { show };
      }
    ),

    initiateRefund: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const show = params.show;
        show.showState.status = ShowStatus.REFUND_INITIATED;
        return { show };
      }
    ),

    receiveDispute: assign(
      (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) => {
        const show = params.show;
        const ticket = params.ticket;
        show.showState.status = ShowStatus.ENDED;
        show.showState.disputes.push(ticket._id);
        show.$inc('showState.disputeStats.totalDisputes', 1);
        show.$inc('showState.disputeStats.totalDisputesPending', 1);
        return { show };
      }
    ),

    receiveResolution: assign(
      (
        _,
        params: {
          show: ShowDocument;
          decision: DisputeDecision;
        }
      ) => {
        const show = params.show;
        const refunded = params.decision === DisputeDecision.NO_REFUND ? 0 : 1;
        show.$inc('showState.disputeStats.totalDisputesPending', -1);
        show.$inc('showState.disputeStats.totalDisputesResolved', 1);
        show.$inc('showState.disputeStats.totalDisputesRefunded', refunded);
        return { show };
      }
    ),

    refundTicket: assign(
      (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) => {
        const show = params.show;
        show.$inc('showState.salesStats.ticketsRefunded', 1);
        show.$inc('showState.salesStats.ticketsSold', -1);
        show.$inc('showState.salesStats.ticketsAvailable', 1);
        show.showState.refunds.push(params.ticket._id);
        return { show };
      }
    ),

    deactivateShow: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const show = params.show;
        show.showState.isActive = false;
        show.showState.current = false;
        return { show };
      }
    ),

    cancelTicket: assign(
      (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) => {
        const show = params.show;
        show.showState.cancellations.push(params.ticket._id);
        show.$inc('showState.salesStats.ticketsAvailable', 1);
        show.$inc('showState.salesStats.ticketsReserved', -1);
        return { show };
      }
    ),

    reserveTicket: assign(
      (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) => {
        const show = params.show;
        show.showState.reservations.push(params.ticket._id);
        show.$inc('showState.salesStats.ticketsAvailable', -1);
        show.$inc('showState.salesStats.ticketsReserved', 1);
        return { show };
      }
    ),

    redeemTicket: assign(
      (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) => {
        const show = params.show;
        show.$inc('showState.salesStats.ticketsRedeemed', 1);
        show.showState.redemptions.push(params.ticket._id);
        return { show };
      }
    ),

    finalizeTicket: assign(
      (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) => {
        const show = params.show;
        show.$inc('showState.salesStats.ticketsFinalized', 1);
        show.showState.finalizations.push(params.ticket._id);
        return { show };
      }
    ),

    sellTicket: assign(
      (
        _,
        params: {
          show: ShowDocument;
          ticket: TicketDocument;
        }
      ) => {
        const show = params.show;
        show.$inc('showState.salesStats.ticketsSold', 1);
        show.$inc('showState.salesStats.ticketsReserved', -1);
        show.showState.sales.push(params.ticket._id);
        return { show };
      }
    ),

    finalizeShow: assign(
      (
        _,
        params: {
          show: ShowDocument;
        }
      ) => {
        const finalize = {
          finalizedAt: new Date()
        };
        const show = params.show;
        show.showState.status = ShowStatus.FINALIZED;
        show.showState.finalize = finalize;
        if (!show.showState.escrow)
          show.showState.escrow = escrowSchema.parse({
            startedAt: new Date()
          });
        show.showState.escrow.endedAt = new Date();
        return { show };
      }
    )
  },
  guards: {
    canCancel: (_, params: { show: ShowDocument }) => {
      const show = params.show;
      return (
        show.price.amount === 0 ||
        show.showState.salesStats.ticketsSold -
          show.showState.salesStats.ticketsRefunded ===
          0
      );
    },
    showCancelled: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.CANCELLED,
    showFinalized: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.FINALIZED,
    showInitiatedCancellation: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.CANCELLATION_INITIATED,
    showInitiatedRefund: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.REFUND_INITIATED,
    showBoxOfficeOpen: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.BOX_OFFICE_OPEN,
    showBoxOfficeClosed: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
    showStarted: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.LIVE,
    showStopped: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.STOPPED,
    showEnded: (_, params: { show: ShowDocument }) =>
      params.show.showState.status === ShowStatus.ENDED,
    soldOut: (_, params: { show: ShowDocument }) =>
      params.show.showState.salesStats.ticketsAvailable === 1,
    canStartShow: (
      _,
      params: {
        show: ShowDocument;
        gracePeriod: number;
      }
    ) => {
      const st = params.show.showState;
      if (st.status === ShowStatus.STOPPED) {
        // Allow grace period to start show again
        if (!st.runtime!.startDate) {
          return false;
        }
        const startDate = new Date(st.runtime!.startDate);
        return (startDate.getTime() ?? 0) + params.gracePeriod > Date.now();
      }
      return st.salesStats.ticketsSold > 0;
    },
    fullyRefunded: (
      _,
      params: {
        show: ShowDocument;
        event: ShowMachineEventType;
      }
    ) => {
      const refunded = params.event.type === 'TICKET REFUNDED' ? 1 : 0;
      return params.show.showState.salesStats.ticketsSold - refunded === 0;
    },
    canFinalize: (
      _,
      params: {
        show: ShowDocument;
        escrowPeriod: number;
      }
    ) => {
      let startTime = 0;
      const show = params.show;
      const startedAt = show.showState.escrow?.startedAt;
      if (startedAt) {
        startTime = new Date(startedAt).getTime();
      }
      const hasUnfinalizedTickets =
        show.showState.salesStats.ticketsSold -
          show.showState.salesStats.ticketsFinalized >
        0;
      const escrowTime = 0 + params.escrowPeriod + startTime;
      const hasDisputes = show.showState.disputeStats.totalDisputesPending > 0;
      const escrowOver = escrowTime < Date.now();
      return escrowOver || (!hasDisputes && !hasUnfinalizedTickets);
    },
    disputesResolved: (
      _,
      params: {
        show: ShowDocument;
        event: ShowMachineEventType;
      }
    ) => {
      const resolved = params.event.type === 'DISPUTE DECIDED' ? 1 : 0;
      return (
        params.show.showState.disputeStats.totalDisputesPending - resolved === 0
      );
    }
  }
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwBk0cJIBiAbQAYBdRUABzVkIBdCaYpxAAPRACYWADjIBOSQEYZ8+SxZKWAFhnaA7ABoQAT0QBWfdrLmZAZkny7GgGwGXkgL6fjlbPiJSCnQMGjpGJiUOJBAePkFhUQkEZTlFFTUNLV0DYzMEPSUbbXkXPTtdfRl9fW9fENwCEnI-MPoIZklo7l4BIREY5KV5NNTMzR09I1NEJSsbLMlLJXMlO30RupA-RsCWkLaIu27Y3oSB0CGZUYz1CZzp-KVJOXMNHRcWF3MXhy2dgLNYLUWjtZjaE5xPqJQZSFQKMZ3bJTPKzNaSMgyTQudRvL4Zf4NQFBVqgiLmSFnfpJCySVEIOwyN5kbQ41TXRQuOyEzC7IGk8IdJguSnxamwlLw9KqJGTXIzBBKbTDMj6cwGFQObSSWo+bZEpokg5koX6UXQi7iKSyBG3LJyx6zVnmVXqjbu5WSXQ8-yG-YgwXMGTm840hAeenrFjyMheux2Nz6YY-GQ+vlBMDEMEAFQAkgBhADSAFFswACABiuYAcgBBKi5gBaxYAIqwQ+LLoh9FzYz9vtpo7JzC5I58XMVJko5rJZC408TyJmcwWS+WW7mAMoABQAqtnW+3RFDQxKe9ZJJ9GeoSh4vpHViwbNVtOZ4xrLNoF36yMvGBud33YsyxbYt81zUC23YY8qRhLsEB7OxMRYfQEyTMocUUSNlWsLltG1cwfjsN4uW-PZfyzCJoJiE9OytBBXyQplFGcYYXBUSQ6QVBMZAnVYyn0Fh1jWN8yKBAAjNAxAAeQAM1kwg8DAaSuEzBh81rat82LKgqFrPNpOrMsa1zPN9MPaiejFOD6JkLj8i9TRMWqeMsRUH5SjEoJJJk+TFOU1TiHUzTtN0-Tc0M4zq1M3NzLbKIYOsy0hhYezrRGV0DGcITB0cbk9QBH8fLkhSlJUtS8yLUsywAJWLTdixqgA1CyOxs5IXDcWNvhqOwlDcXisIVHEkNkeMHHsJUcq88hir8srAoYSq11q+rGpa+K2uS60kzIFCqg2eRCNSpR6V4-RMWeHUygqFxBN1epeUXMg5tKgKKtXaqNK0nSqFaxKLTDZRlAUFhzDUL11HY0p6RqIpmMhzQtGGJQZpeqSSv88qguW6rN2kqgoK2oGlQnb5PjmNxGT0GR6Tul0oc46cXPptHXqxxbNwACWkgB1MtN2zWsaoPImAdPeD9DSlJ7BjPROveJNlBWNmMfm96cc+8s6orXdq0go8aNg7bJUvVUtG+Yi5nOux6UsGMjr6pwE2E0iCoNcj2aU-MABteEYbm+YFoWRf+o2krDTqLx61D+t0HFpeeVYyFY1ChKWdV53dp6irVt7ff9jpcfLb7Qr+sXw8BiU7ujyxY4GhOzpWFlVGdBx5FfaNVd8-O-dgRhi4FgmK6sqv4KVVCbCVBxXEhmGFSsCdozu74RnjNRUez31Pbz-yC-7outdW3X9bD0eJfomvurrvqG6G-InAu1RCPkKodRKJlu8x72+8YUvfvCpFEyZlRaG3PnRZI98pA6hjLoZ4YMfiTC8FvdMs1d4-0LsFH6YUDJGWAbFUBCVK4Xw6l8FkVgvhlFZF6Hs9I8p7SyN8dUrhVjmDRrAfgOAABO-AA4835oLYWoDLKnAjhKLEchrp11Sm+WwdD5DPFjM6Hs4NdB9XYZwnhA8j51VAsWLAZ9RFj3ohsOQg4O7OFsEsHE5g6EyH6rGJw6pqhJjmE4DR3DeEdHzLuQW0kDE1TLAAKWkjWQxtF2rdlKHtFQNiKgjjuvIOhKjVROOXtoRkB0PFaO8b47M-jGplj+hWbMYCjEkMQFiF0j4O5Mi0JMW2CodTNzygYMG-U67ZK8QwQOAj8nbm3OE42YYRwxhQvY5MypX5qnkRlMGbgSiKF0COB6+oc7kQ4WgLgqkOi9ODkIoZYj4KjL2lUacR0pk1FsU09QGItAVCZpoaQWdHrb35PwLZOyen8LLMWU+I9ykQO7NLBMaxHFCR4kdFxaMSB9BwF4-MOBiBKR9j7eF-QyAYBwH0YgUBJA1TALJAArlmBgOs9YtiijFOKZSIkmzKE+M50hZDTncLTJp5zYx9TjB3WwboYXEDhQipFKK0XnDILCwQ8LIAEuJaSwe5L-m0uGRKK6RQcicWkP1F42g6HRjkGqVkTJZBWEHGwlBz1JWEGlRARFyKwCovRcICVgqpVeNlSSw+VVtbFhPgbIh4DIkFDVAoN80YaHXEYnqiofY2l2A7gojw3g9TEDQPQeAMRCp7HFkChAABaUcCoC0MPeKW94zxUwWp-AKdoOag3anpNOPqe1VhJhQuxZ+qys1AjwCKh1PtIB1pNisWwqpLYeEZMqRkhaHLqgxPG9eqgbHPC-FW8if4IBDrDM4C6l5CLjQcPxEF90WRpJlPhcGXaPZAgUsQHAPtCAAC9B3ENzZ8C6nxnZ6FKEJDYkYJEsjZBsaMeJGRf3VtjLdqqhJPkHBOnsehBw6HpKUA1lsPi2AcCocDvdC5QfgmolOUM51Dh0I0-IUw9olA2IyFCYMUJdJfYGk2OEWRTV0ChHVl4Z2IFYkhYYP78IqDgS8tZbySQfO2UxwFQbeIGo-nJ1YKh7zcRHWQNYrIKjaitvhAVQrIB2tFU6y0dKwysmsNygit1M6dUbR3CchqXETtfp5NdQIrU2sM-24zmLsWCFxfiwlnr8P0VWPOldSxrOskdJKbULIb52Q7qlV+em3UGb7Y68VHn3VBazCFyBugyCJIVhkPCuqOXEVjPtPqNQXhrGTZ4IAA */
  context: ({ input }) => ({
    show: input.show,
    errorMessage: undefined as string | undefined,
    id: nanoid(),
    showQueue: new Queue(EntityType.SHOW, {
      connection: input.redisConnection
    }) as ShowQueueType,
    options: {
      escrowPeriod: input.options?.escrowPeriod ?? 3_600_000,
      gracePeriod: input.options?.gracePeriod ?? 3_600_000
    } as ShowMachineOptions
  }),
  id: 'showMachine',
  initial: 'showLoaded',
  exit: ({ context }) => {
    if (context.showQueue) {
      context.showQueue.close();
    }
  },
  states: {
    showLoaded: {
      always: [
        {
          target: 'boxOfficeOpen',
          guard: {
            type: 'showBoxOfficeOpen',
            params: ({ context }) => ({ show: context.show })
          }
        },
        {
          target: 'boxOfficeClosed',
          guard: {
            type: 'showBoxOfficeClosed',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'initiatedCancellation',
          guard: {
            type: 'showInitiatedCancellation',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'initiatedCancellation.initiatedRefund',
          guard: {
            type: 'showInitiatedRefund',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'cancelled',
          guard: {
            type: 'showCancelled',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'finalized',
          guard: {
            type: 'showFinalized',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'started',
          guard: {
            type: 'showStarted',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'stopped',
          guard: {
            type: 'showStopped',
            params: ({ context }) => ({
              show: context.show
            })
          }
        },
        {
          target: 'ended',
          guard: {
            type: 'showEnded',
            params: ({ context }) => ({
              show: context.show
            })
          }
        }
      ]
    },
    cancelled: {
      type: 'final',
      entry: [
        {
          type: 'deactivateShow',
          params: ({ context }) => ({ show: context.show })
        }
      ]
    },
    ended: {
      always: {
        target: 'finalized',
        guard: {
          type: 'canFinalize',
          params: ({ context }) => ({
            show: context.show,
            escrowPeriod: context.options.escrowPeriod
          })
        },
        actions: [
          {
            type: 'finalizeShow',
            params: ({ context }) => ({
              show: context.show
            })
          },
          {
            type: 'queueShowJob',
            params: ({ context }) => ({
              show: context.show,
              showQueue: context.showQueue,
              jobType: 'CALCULATE STATS'
            })
          }
        ]
      },
      on: {
        'TICKET FINALIZED': {
          actions: [
            {
              type: 'finalizeTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'TICKET DISPUTED': {
          actions: [
            {
              type: 'receiveDispute',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'DISPUTE DECIDED': [
          {
            actions: [
              {
                type: 'receiveResolution',
                params: ({ context, event }) => ({
                  show: context.show,
                  decision: event.decision
                })
              }
            ]
          }
        ]
      }
    },
    finalized: {
      type: 'final',
      entry: [
        {
          type: 'deactivateShow',
          params: ({ context }) => ({ show: context.show })
        }
      ]
    },
    boxOfficeOpen: {
      on: {
        'CANCELLATION INITIATED': [
          {
            target: 'cancelled',
            guard: {
              type: 'canCancel',
              params: ({ context }) => ({
                show: context.show
              })
            },
            actions: [
              {
                type: 'initiateCancellation',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel
                })
              },
              {
                type: 'cancelShow',
                params: ({ context }) => ({
                  show: context.show
                })
              }
            ]
          },
          {
            target: 'initiatedCancellation',
            actions: [
              {
                type: 'initiateCancellation',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel
                })
              },
              {
                type: 'queueCancelTickets',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel,
                  showQueue: context.showQueue
                })
              }
            ]
          }
        ],
        'TICKET RESERVED': [
          {
            target: 'boxOfficeClosed',
            guard: {
              type: 'soldOut',
              params: ({ context }) => ({
                show: context.show
              })
            },
            actions: [
              {
                type: 'reserveTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              },
              {
                type: 'closeBoxOffice',
                params: ({ context }) => ({
                  show: context.show
                })
              }
            ]
          },
          {
            actions: [
              {
                type: 'reserveTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ]
          }
        ],
        'TICKET CANCELLED': {
          actions: [
            {
              type: 'cancelTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'TICKET SOLD': {
          actions: [
            {
              type: 'sellTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'SHOW STARTED': {
          target: 'started',
          guard: {
            type: 'canStartShow',
            params: ({ context }) => ({
              show: context.show,
              gracePeriod: context.options.escrowPeriod
            })
          },
          actions: [
            {
              type: 'startShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        },
        'TICKET REFUNDED': [
          {
            actions: [
              {
                type: 'refundTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ]
          }
        ]
      }
    },
    boxOfficeClosed: {
      on: {
        'SHOW STARTED': {
          guard: {
            type: 'canStartShow',
            params: ({ context }) => ({
              show: context.show,
              gracePeriod: context.options.escrowPeriod
            })
          },
          target: 'started',
          actions: [
            {
              type: 'startShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        },
        'TICKET CANCELLED': [
          {
            target: 'boxOfficeOpen',
            actions: [
              {
                type: 'openBoxOffice',
                params: ({ context }) => ({
                  show: context.show
                })
              },
              {
                type: 'cancelTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ]
          }
        ],
        'TICKET SOLD': {
          actions: [
            {
              type: 'sellTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'TICKET REFUNDED': [
          {
            actions: [
              {
                type: 'openBoxOffice',
                params: ({ context }) => ({
                  show: context.show
                })
              },
              {
                type: 'refundTicket',
                params: ({ context, event }) => ({
                  show: context.show,
                  ticket: event.ticket
                })
              }
            ],
            target: 'boxOfficeOpen'
          }
        ],
        'CANCELLATION INITIATED': [
          {
            target: 'cancelled',
            guard: {
              type: 'canCancel',
              params: ({ context }) => ({ show: context.show })
            },
            actions: [
              {
                type: 'initiateCancellation',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel
                })
              },
              {
                type: 'cancelShow',
                params: ({ context }) => ({
                  show: context.show
                })
              }
            ]
          },
          {
            target: 'initiatedCancellation',
            actions: [
              {
                type: 'initiateCancellation',
                params: ({ context, event }) => ({
                  show: context.show,
                  cancel: event.cancel
                })
              }
            ]
          }
        ]
      }
    },
    started: {
      on: {
        'SHOW STARTED': {
          actions: [
            {
              type: 'startShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        },
        'TICKET REDEEMED': {
          actions: [
            {
              type: 'redeemTicket',
              params: ({ context, event }) => ({
                show: context.show,
                ticket: event.ticket
              })
            }
          ]
        },
        'CUSTOMER JOINED': {},
        'CUSTOMER LEFT': {},
        'SHOW STOPPED': {
          target: 'stopped',
          actions: [
            {
              type: 'stopShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ]
        }
      }
    },
    stopped: {
      on: {
        'SHOW STARTED': {
          target: 'started',
          actions: [
            {
              type: 'startShow',
              params: ({ context }) => ({
                show: context.show
              })
            }
          ],
          guard: {
            type: 'canStartShow',
            params: ({ context }) => ({
              show: context.show,
              gracePeriod: context.options.escrowPeriod
            })
          }
        },
        'SHOW ENDED': {
          target: 'ended',
          actions: [
            {
              type: 'endShow',
              params: ({ context }) => ({
                show: context.show
              })
            },
            {
              type: 'queueShowJob',
              params: ({ context }) => ({
                show: context.show,
                showQueue: context.showQueue,
                jobType: 'END SHOW'
              })
            }
          ]
        }
      }
    },
    initiatedCancellation: {
      initial: 'waiting2Refund',
      states: {
        waiting2Refund: {
          on: {
            'REFUND INITIATED': {
              target: 'initiatedRefund',
              actions: [
                {
                  type: 'initiateRefund',
                  params: ({ context }) => ({
                    show: context.show
                  })
                },
                {
                  type: 'queueShowJob',
                  params: ({ context }) => ({
                    show: context.show,
                    showQueue: context.showQueue,
                    jobType: 'REFUND TICKETS'
                  })
                }
              ]
            }
          }
        },
        initiatedRefund: {
          on: {
            'TICKET REFUNDED': [
              {
                target: '#showMachine.cancelled',
                guard: {
                  type: 'fullyRefunded',
                  params: ({ context, event }) => ({
                    show: context.show,
                    event
                  })
                },
                actions: [
                  {
                    type: 'refundTicket',
                    params: ({ context, event }) => ({
                      show: context.show,
                      ticket: event.ticket
                    })
                  },
                  {
                    type: 'cancelShow',
                    params: ({ context }) => ({
                      show: context.show
                    })
                  }
                ]
              },
              {
                actions: [
                  {
                    type: 'refundTicket',
                    params: ({ context, event }) => ({
                      show: context.show,
                      ticket: event.ticket
                    })
                  }
                ]
              }
            ]
          }
        }
      }
    }
  }
});

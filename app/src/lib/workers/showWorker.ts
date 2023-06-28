import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';

import type {
  CancelType,
  DisputeDecision,
  DisputeType,
  RefundType,
  SaleType
} from '$lib/models/common';
import {
  CancelReason,
  type FinalizeType,
  RefundReason
} from '$lib/models/common';
import type { ShowType } from '$lib/models/show';
import { SaveState, Show, ShowStatus } from '$lib/models/show';
import { createShowEvent } from '$lib/models/showEvent';
import { Talent } from '$lib/models/talent';
import { Ticket, TicketStatus } from '$lib/models/ticket';
import type { TransactionType } from '$lib/models/transaction';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';

import {
  createShowMachineService,
  ShowMachineEventString
} from '$lib/machines/showMachine';
import type { TicketMachineEventType } from '$lib/machines/ticketMachine';
import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import { ActorType, EntityType } from '$lib/constants';
import { getTicketMachineService } from '$lib/util/util.server';

export const getShowWorker = (
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>,
  redisConnection: IORedis
) => {
  return new Worker(
    EntityType.SHOW,
    async (job: Job<ShowJobDataType, any, ShowMachineEventString>) => {
      const show = (await Show.findById(job.data.showId).exec()) as ShowType;
      if (!show) {
        return;
      }

      switch (job.name) {
        case ShowMachineEventString.CANCELLATION_INITIATED: {
          cancelShow(show, job.data.cancel, showQueue);
          break;
        }
        case ShowMachineEventString.REFUND_INITIATED: {
          refundShow(show, showQueue);
          break;
        }
        case ShowMachineEventString.SHOW_ENDED: {
          endShow(show, showQueue);
          break;
        }
        case ShowMachineEventString.SHOW_STOPPED: {
          stopShow(show, showQueue);
          break;
        }
        case ShowMachineEventString.SHOW_FINALIZED: {
          finalizeShow(show, job.data.finalize, showQueue);
          break;
        }
        case ShowMachineEventString.ESCROW_ENDED: {
          endEscrow(show, showQueue);
          break;
        }
        // From Ticket Machine
        case ShowMachineEventString.CUSTOMER_JOINED: {
          customerJoined(
            show,
            job.data.ticketId,
            job.data.customerName,
            showQueue
          );
          break;
        }
        case ShowMachineEventString.CUSTOMER_LEFT: {
          customerLeft(
            show,
            job.data.ticketId,
            job.data.customerName,
            showQueue
          );
          break;
        }
        case ShowMachineEventString.TICKET_SOLD: {
          ticketSold(
            show,
            job.data.ticketId,
            job.data.sale,
            job.data.customerName,
            showQueue
          );
          break;
        }
        case ShowMachineEventString.TICKET_REDEEMED: {
          ticketRedeemed(show, job.data.ticketId, showQueue);
          break;
        }
        case ShowMachineEventString.TICKET_RESERVED: {
          ticketReserved(
            show,
            job.data.ticketId,
            job.data.customerName,
            showQueue
          );
          break;
        }
        case ShowMachineEventString.TICKET_REFUNDED: {
          ticketRefunded(show, job.data.refund, showQueue);
          break;
        }
        case ShowMachineEventString.TICKET_CANCELLED: {
          ticketCancelled(show, job.data.ticketId, showQueue);
          break;
        }
        case ShowMachineEventString.FEEDBACK_RECEIVED: {
          feedbackReceived(show, showQueue);
          break;
        }
        case ShowMachineEventString.TICKET_DISPUTED: {
          ticketDisputed(show, job.data.dispute, showQueue);
          break;
        }
        case ShowMachineEventString.DISPUTE_RESOLVED: {
          ticketDisputeResolved(show, job.data.decision, showQueue);
          break;
        }
      }
    },
    { autorun: false, connection: redisConnection }
  );
};

export type ShowJobDataType = {
  showId: string;
  [key: string]: any;
};

const cancelShow = async (
  show: ShowType,
  cancel: CancelType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction }),
      jobQueue: showQueue
    }
  });

  showService.send({
    type: ShowMachineEventString.CANCELLATION_INITIATED,
    cancel
  });

  const tickets = await Ticket.find({
    show: show._id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'ticketState.activeState': true
  });
  for (const ticket of tickets) {
    // send cancel show to all tickets
    const ticketService = getTicketMachineService(ticket, showQueue);

    const cancelEvent = {
      type: TicketMachineEventString.SHOW_CANCELLED,
      cancel
    } as TicketMachineEventType;
    ticketService.send(cancelEvent);
    ticketService.stop();
  }
  const showState = showService.getSnapshot();
  if (showState.matches('initiatedCancellation.waiting2Refund')) {
    showService.send(ShowMachineEventString.REFUND_INITIATED);
  }
  showService.stop();
};

const refundShow = async (
  show: ShowType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction }),
      jobQueue: showQueue
    }
  });

  // Check if show needs to send refunds
  const showState = showService.getSnapshot();
  if (showState.matches('initiatedCancellation.initiatedRefund')) {
    const tickets = await Ticket.find({
      show: show._id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'ticketState.activeState': true
    });
    for (const ticket of tickets) {
      // send refunds
      //TODO: Send real transactions
      const ticketService = getTicketMachineService(ticket, showQueue);
      const ticketState = ticketService.getSnapshot();
      if (
        ticketState.matches('reserved.initiatedCancellation.waiting4Refund')
      ) {
        const refundTransaction = (await Transaction.create({
          ticket: ticket._id,
          talent: ticket.talent,
          agent: ticket.agent,
          show: ticket.show,
          reason: TransactionReasonType.TICKET_REFUND,
          hash: '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e',
          from: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
          to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
          value: ticket.ticketState.totalPaid - ticket.ticketState.totalRefunded
        })) as TransactionType;

        ticketService.send({
          type: TicketMachineEventString.REFUND_RECEIVED,
          transaction: refundTransaction,
          reason: RefundReason.SHOW_CANCELLED
        });
        ticketService.stop();
      }
    }
  }
  showService.stop();
};

const stopShow = async (
  show: ShowType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction }),
      jobQueue: showQueue
    }
  });

  const showState = showService.getSnapshot();
  if (showState.matches('stopped')) {
    showService.send(ShowMachineEventString.SHOW_ENDED);
  }
};

const endEscrow = async (
  show: ShowType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction }),
      jobQueue: showQueue
    }
  });

  const showState = showService.getSnapshot();
  if (showState.matches('ended.inEscrow')) {
    showService.send({
      type: ShowMachineEventString.SHOW_FINALIZED,
      finalize: {
        finalizedAt: new Date(),
        finalizedBy: ActorType.TIMER
      } as FinalizeType
    });
  }
  showService.stop();
};

// End show, alert ticket
const endShow = async (
  show: ShowType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction }),
      jobQueue: showQueue
    }
  });

  // Tell ticket holders the show is over folks
  const showState = showService.getSnapshot();
  if (showState.matches('ended.inEscrow')) {
    const tickets = await Ticket.find({
      show: show._id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'ticketState.activeState': true
    });
    for (const ticket of tickets) {
      // send show is over
      const ticketService = getTicketMachineService(ticket, showQueue);
      ticketService.send(TicketMachineEventString.SHOW_ENDED);
      ticketService.stop();
    }
  }
  showService.stop();
};

const finalizeShow = async (
  show: ShowType,
  finalize: FinalizeType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  // Finalize all the tickets, feedback or not
  const tickets = await Ticket.find({
    show: show._id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'ticketState.activeState': true
  });
  for (const ticket of tickets) {
    const ticketService = getTicketMachineService(ticket, showQueue);
    const ticketState = ticketService.getSnapshot();

    if (ticketState.matches('ended.inEscrow')) {
      ticketService.send({
        type: TicketMachineEventString.TICKET_FINALIZED,
        finalize
      });
    }
  }
  // Calculate sales stats
  const talentSession = await Talent.startSession();
  await talentSession.withTransaction(async () => {
    const showFilter = {
      talent: show.talent,
      'showState.status': ShowStatus.FINALIZED
    };

    const groupBy = {
      _id: undefined,
      totalSales: { $sum: '$showState.salesStats.totalSales' },
      numberOfCompletedShows: { $sum: 1 },
      totalRefunded: { $sum: '$showState.salesStats.totalRefunded' },
      totalRevenue: { $sum: '$showState.salesStats.totalRevenue' }
    };

    const aggregate = await Show.aggregate().match(showFilter).group(groupBy);

    if (aggregate.length === 0) {
      return;
    }

    const totalSales = aggregate[0]['totalSales'] as number;
    const numberOfCompletedShows = aggregate[0][
      'numberOfCompletedShows'
    ] as number;
    const totalRefunded = aggregate[0]['totalRefunded'] as number;
    const totalRevenue = aggregate[0]['totalRevenue'] as number;

    await Talent.findByIdAndUpdate(
      { _id: show.talent },
      {
        'salesStats.totalSales': totalSales,
        'salesStats.numberOfCompletedShows': numberOfCompletedShows,
        'salesStats.totalRefunded': totalRefunded,
        'salesStats.totalRevenue': totalRevenue
      }
    );
    talentSession.endSession();
  });
};

// Ticket Events
const customerJoined = async (
  show: ShowType,
  ticketId: string,
  customerName: string,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({
          show,
          type,
          ticketId,
          transaction,
          ticketInfo: { customerName }
        }),
      jobQueue: showQueue
    }
  });
  showService.send({
    type: ShowMachineEventString.CUSTOMER_JOINED,
    ticketId,
    customerName
  });
};

const customerLeft = async (
  show: ShowType,
  ticketId: string,
  customerName: string,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({
          show,
          type,
          ticketId,
          transaction,
          ticketInfo: { customerName }
        }),
      jobQueue: showQueue
    }
  });
  showService.send({
    type: ShowMachineEventString.CUSTOMER_LEFT,
    ticketId,
    customerName
  });
};

const ticketSold = async (
  show: ShowType,
  ticketId: string,
  sale: SaleType,
  customerName: string,

  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({
          show,
          type,
          ticketId,
          transaction,
          ticketInfo: { customerName }
        }),
      jobQueue: showQueue
    }
  });
  showService.send({
    type: ShowMachineEventString.TICKET_SOLD,
    ticketId,
    sale,
    customerName
  });
};

const ticketRedeemed = async (
  show: ShowType,
  ticketId: string,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction }),
      jobQueue: showQueue
    }
  });

  showService.send({
    type: ShowMachineEventString.TICKET_REDEEMED,
    ticketId
  });
};

const ticketReserved = async (
  show: ShowType,
  ticketId: string,
  customerName: string,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({
          show,
          type,
          ticketId,
          transaction,
          ticketInfo: { customerName }
        }),
      jobQueue: showQueue
    }
  });

  showService.send({
    type: ShowMachineEventString.TICKET_RESERVED,
    ticketId,
    customerName
  });
};

const ticketRefunded = async (
  show: ShowType,
  refund: RefundType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction }),
      jobQueue: showQueue
    }
  });

  showService.send({
    type: ShowMachineEventString.TICKET_REFUNDED,
    refund
  });
};

const ticketCancelled = async (
  show: ShowType,
  ticketId: string,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction }),
      jobQueue: showQueue
    }
  });

  showService.send({
    type: ShowMachineEventString.TICKET_CANCELLED,
    ticketId
  });
};

// Calculate feedback stats
const feedbackReceived = async (
  show: ShowType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction }),
      jobQueue: showQueue
    }
  });
  showService.send(ShowMachineEventString.FEEDBACK_RECEIVED);
  const showSession = await Show.startSession();

  await showSession.withTransaction(async () => {
    // aggregate ticket feedback into show
    const ticketFilter = {
      show: show._id,
      'ticketState.status': TicketStatus.FINALIZED
    };

    const groupBy = {
      _id: undefined,
      numberOfReviews: { $sum: 1 },
      averageRating: { $avg: '$ticketState.feedback.rating' }
    };

    const aggregate = await Ticket.aggregate()
      .match(ticketFilter)
      .group(groupBy);

    console.log('aggregate', aggregate);

    if (aggregate.length === 0) {
      return;
    }

    const averageRating = aggregate[0]['averageRating'] as number;
    const numberOfReviews = aggregate[0]['numberOfReviews'] as number;

    show.showState.feedbackStats = {
      averageRating,
      numberOfReviews
    };

    await show.save();
    showSession!.endSession();
  });

  // aggregate show feedback into talent
  const talentSession = await Talent.startSession();
  await talentSession.withTransaction(async () => {
    const showFilter = {
      talent: show.talent,
      'showState.feedbackStats.numberOfReviews': { $gt: 0 }
    };

    const groupBy = {
      _id: undefined,
      numberOfReviews: { $sum: '$showState.feedbackStats.numberOfReviews' },
      averageRating: { $avg: '$showState.feedbackStats.averageRating' }
    };

    const aggregate = await Show.aggregate().match(showFilter).group(groupBy);

    if (aggregate.length === 0) {
      return;
    }

    const averageRating = aggregate[0]['averageRating'] as number;
    const numberOfReviews = aggregate[0]['numberOfReviews'] as number;

    await Talent.findByIdAndUpdate(
      { _id: show.talent },
      {
        'feedbackStats.averageRating': averageRating,
        'feedbackStats.numberOfReviews': numberOfReviews
      }
    );
    talentSession.endSession();
  });
};

const ticketDisputed = async (
  show: ShowType,
  dispute: DisputeType,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction }),
      jobQueue: showQueue
    }
  });

  showService.send({
    type: ShowMachineEventString.TICKET_DISPUTED,
    dispute
  });
};

const ticketDisputeResolved = async (
  show: ShowType,
  decision: DisputeDecision,
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction }),
      jobQueue: showQueue
    }
  });

  showService.send({
    type: ShowMachineEventString.DISPUTE_RESOLVED,
    decision
  });
};

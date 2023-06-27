import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';

import type { CancelType } from '$lib/models/common';
import {
  CancelReason,
  type FinalizeType,
  RefundReason
} from '$lib/models/common';
import type { ShowType } from '$lib/models/show';
import { SaveState, Show, ShowStatus } from '$lib/models/show';
import { createShowEvent } from '$lib/models/showEvent';
import { Talent } from '$lib/models/talent';
import { Ticket } from '$lib/models/ticket';
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
          cancelShow(show, showQueue);
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
        case ShowMachineEventString.FEEDBACK_RECEIVED: {
          feedbackReceived(show);
          break;
        }
        case ShowMachineEventString.ESCROW_ENDED: {
          endEscrow(show, showQueue);
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
  showQueue: Queue<ShowJobDataType, any, ShowMachineEventString>
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
      jobQueue: showQueue
    }
  });

  const tickets = await Ticket.find({
    show: show._id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'ticketState.activeState': true
  });
  for (const ticket of tickets) {
    // send cancel show to all tickets
    const ticketService = getTicketMachineService(ticket, show, showQueue);
    const cancel = {
      cancelledBy: ActorType.TALENT,
      cancelledInState: JSON.stringify(ticketService.getSnapshot().value),
      reason: CancelReason.TALENT_CANCELLED,
      cancelledAt: new Date()
    } as CancelType;

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
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
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
      const ticketService = getTicketMachineService(ticket, show, showQueue);
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
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
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
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
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
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        createShowEvent({ show, type, ticket, transaction }),
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
      const ticketService = getTicketMachineService(ticket, show, showQueue);
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
    const ticketService = getTicketMachineService(ticket, show, showQueue);
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

// Calculate feedback stats
const feedbackReceived = async (show: ShowType) => {
  const showSession = await Show.startSession();

  await showSession.withTransaction(async () => {
    // aggregate ticket feedback into show
    const ticketFilter = {
      show: show._id,
      'ticketState.feedback.rating': { $exists: true }
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

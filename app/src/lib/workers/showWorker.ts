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
import { CancelReason, RefundReason } from '$lib/models/common';
import { Creator } from '$lib/models/creator';
import type { ShowType } from '$lib/models/show';
import { SaveState, Show, ShowStatus } from '$lib/models/show';
import { createShowEvent } from '$lib/models/showEvent';
import { Ticket, TicketStatus } from '$lib/models/ticket';
import type { TransactionType } from '$lib/models/transaction';
import { Transaction, TransactionReasonType } from '$lib/models/transaction';

import {
  createShowMachineService,
  ShowMachineEventString
} from '$lib/machines/showMachine';
import type { TicketMachineEventType } from '$lib/machines/ticketMachine';
import { TicketMachineEventString } from '$lib/machines/ticketMachine';

import { deleteInvoiceInvoicesModelIdDelete } from '$lib/bitcart';
import { ActorType, EntityType } from '$lib/constants';
import {
  getTicketMachineService,
  getTicketMachineServiceFromId
} from '$lib/util/util.server';

export const getShowWorker = ({
  showQueue,
  redisConnection,
  paymentAuthToken,
  escrowPeriod = 3_600_000,
  gracePeriod = 3_600_000,
  paymentPeriod = 3_600_000
}: {
  showQueue: ShowQueueType;
  redisConnection: IORedis;
  paymentAuthToken: string;
  escrowPeriod: number;
  gracePeriod: number;
  paymentPeriod: number;
}) => {
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
        case ShowMachineEventString.SHOW_STARTED: {
          startShow(show);
          break;
        }
        case ShowMachineEventString.SHOW_ENDED: {
          endShow(show, escrowPeriod, showQueue);
          break;
        }
        case ShowMachineEventString.SHOW_STOPPED: {
          stopShow(show, gracePeriod, showQueue);
          break;
        }
        case ShowMachineEventString.SHOW_FINALIZED: {
          finalizeShow(show, showQueue);
          break;
        }

        // From Ticket Machine
        case ShowMachineEventString.CUSTOMER_JOINED: {
          customerJoined(show, job.data.ticketId, job.data.customerName);
          break;
        }
        case ShowMachineEventString.CUSTOMER_LEFT: {
          customerLeft(show, job.data.ticketId, job.data.customerName);
          break;
        }
        case ShowMachineEventString.TICKET_SOLD: {
          ticketSold(
            show,
            job.data.ticketId,
            job.data.sale,
            job.data.customerName
          );
          break;
        }
        case ShowMachineEventString.TICKET_REDEEMED: {
          ticketRedeemed(show, job.data.ticketId);
          break;
        }
        case ShowMachineEventString.TICKET_RESERVED: {
          ticketReserved(
            show,
            job.data.ticketId,
            job.data.customerName,
            paymentPeriod,
            showQueue
          );
          break;
        }
        case ShowMachineEventString.TICKET_REFUNDED: {
          ticketRefunded(show, job.data.refund);
          break;
        }
        case ShowMachineEventString.TICKET_CANCELLED: {
          ticketCancelled(
            show,
            job.data.ticketId,
            paymentAuthToken,
            job.data.customerName
          );
          break;
        }
        case ShowMachineEventString.TICKET_FINALIZED: {
          ticketFinalized(show, job.data.ticketId);
          break;
        }
        case ShowMachineEventString.TICKET_DISPUTED: {
          ticketDisputed(show, job.data.dispute);
          break;
        }
        case ShowMachineEventString.DISPUTE_RESOLVED: {
          ticketDisputeResolved(
            show,
            job.data.ticketId,
            job.data.decision,
            showQueue
          );
          break;
        }
        case ShowMachineEventString.TICKET_RESERVATION_TIMEOUT: {
          ticketReservationTimeout(job.data.ticketId, showQueue);
          break;
        }
        default: {
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

export type ShowQueueType = Queue<ShowJobDataType, any, ShowMachineEventString>;

const cancelShow = async (
  show: ShowType,
  cancel: CancelType,
  showQueue: ShowQueueType
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
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
    showQueue.add(ShowMachineEventString.REFUND_INITIATED, {
      showId: show._id.toString()
    });
  }
  showService.stop();
};

const refundShow = async (show: ShowType, showQueue: ShowQueueType) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction })
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
          creator: ticket.creator,
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
const startShow = async (show: ShowType) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction })
    }
  });
  showService.send(ShowMachineEventString.SHOW_STARTED);
};

const stopShow = async (
  show: ShowType,
  gracePeriod: number,
  showQueue: ShowQueueType
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction })
    }
  });
  showService.send(ShowMachineEventString.SHOW_STOPPED);

  // once a show is stopped, end it after grace gracePeriod
  showQueue.add(
    ShowMachineEventString.SHOW_ENDED,
    {
      showId: show._id.toString()
    },
    { delay: gracePeriod }
  );
};

// End show, alert ticket
const endShow = async (
  show: ShowType,
  escrowPeriod: number,
  showQueue: ShowQueueType
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction })
    }
  });

  const showState = showService.getSnapshot();
  if (showState.matches('stopped')) {
    showService.send(ShowMachineEventString.SHOW_ENDED);
    showQueue.add(
      ShowMachineEventString.SHOW_FINALIZED,
      {
        showId: show._id.toString()
      },
      { delay: escrowPeriod }
    );

    // Tell ticket holders the show is over folks
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

const finalizeShow = async (show: ShowType, showQueue: ShowQueueType) => {
  // Finalize show if not already finalized
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction })
    }
  });

  const showState = showService.getSnapshot();
  const finalize = {
    finalizedAt: new Date(),
    finalizedBy: ActorType.TIMER
  };
  if (
    showState.can({
      type: ShowMachineEventString.SHOW_FINALIZED,
      finalize
    })
  ) {
    showService.send({
      type: ShowMachineEventString.SHOW_FINALIZED,
      finalize
    });
  }

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
  const creatorSession = await Creator.startSession();
  await creatorSession.withTransaction(async () => {
    const showFilter = {
      creator: show.creator,
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

    await Creator.findByIdAndUpdate(
      { _id: show.creator },
      {
        'salesStats.totalSales': totalSales,
        'salesStats.numberOfCompletedShows': numberOfCompletedShows,
        'salesStats.totalRefunded': totalRefunded,
        'salesStats.totalRevenue': totalRevenue
      }
    );
    creatorSession.endSession();
  });
};

// Ticket Events
const customerJoined = async (
  show: ShowType,
  ticketId: string,
  customerName: string
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
        })
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
  customerName: string
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
        })
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
  customerName: string
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
        })
    }
  });
  showService.send({
    type: ShowMachineEventString.TICKET_SOLD,
    ticketId,
    sale,
    customerName
  });
};

const ticketRedeemed = async (show: ShowType, ticketId: string) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
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
  paymentPeriod: number,
  showQueue: ShowQueueType
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
        })
    }
  });

  showService.send({
    type: ShowMachineEventString.TICKET_RESERVED,
    ticketId,
    customerName
  });

  showQueue.add(
    ShowMachineEventString.TICKET_RESERVATION_TIMEOUT,
    {
      showId: show._id.toString()
    },
    { delay: paymentPeriod }
  );
};

const ticketRefunded = async (show: ShowType, refund: RefundType) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
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
  paymentAuthToken: string,
  customerName: string
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
        })
    }
  });

  showService.send({
    type: ShowMachineEventString.TICKET_CANCELLED,
    ticketId,
    customerName
  });

  // Cancel invoice in Bitcart
  const ticket = await Ticket.findById(ticketId, 'invoiceId').exec();

  if (ticket && ticket.invoiceId) {
    // Delete invoice in Bitcart
    deleteInvoiceInvoicesModelIdDelete(ticket.invoiceId, {
      headers: {
        Authorization: `Bearer ${paymentAuthToken}`,
        'Content-Type': 'application/json'
      }
    });
  }
};

// Calculate feedback stats
const ticketFinalized = async (show: ShowType, ticketId: string) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
    }
  });
  const showState = showService.getSnapshot();

  if (
    showState.can({
      type: ShowMachineEventString.TICKET_FINALIZED,
      ticketId
    })
  ) {
    showService.send({
      type: ShowMachineEventString.TICKET_FINALIZED,
      ticketId
    });
  }
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
      averageRating: { $avg: '$ticketState.feedback.rating' },
      comments: { $push: '$ticketState.feedback.comment' }
    };

    const aggregate = await Ticket.aggregate()
      .match(ticketFilter)
      .group(groupBy);

    if (aggregate.length === 0) {
      return;
    }

    const averageRating = aggregate[0]['averageRating'] as number;
    const numberOfReviews = aggregate[0]['numberOfReviews'] as number;
    const comments = aggregate[0]['comments'] as string[];

    show.showState.feedbackStats = {
      averageRating,
      numberOfReviews,
      comments
    };

    await show.save();
    showSession!.endSession();
  });

  // aggregate show feedback into creator
  const creatorSession = await Creator.startSession();
  await creatorSession.withTransaction(async () => {
    const showFilter = {
      creator: show.creator,
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

    await Creator.findByIdAndUpdate(
      { _id: show.creator },
      {
        'feedbackStats.averageRating': averageRating,
        'feedbackStats.numberOfReviews': numberOfReviews
      }
    );
    creatorSession.endSession();
  });
};

const ticketDisputed = async (show: ShowType, dispute: DisputeType) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
    }
  });

  showService.send({
    type: ShowMachineEventString.TICKET_DISPUTED,
    dispute
  });
};

const ticketReservationTimeout = async (
  ticketId: string,
  showQueue: ShowQueueType
) => {
  const ticketService = await getTicketMachineServiceFromId(
    ticketId,
    showQueue
  );

  const ticketState = ticketService.getSnapshot();

  if (ticketState.matches('reserved.waiting4Payment')) {
    const cancel = {
      cancelledInState: JSON.stringify(ticketState.value),
      reason: CancelReason.TICKET_PAYMENT_TIMEOUT,
      cancelledBy: ActorType.TIMER
    } as CancelType;
    ticketService.send({
      type: TicketMachineEventString.CANCELLATION_INITIATED,
      cancel
    });
  }
};

const ticketDisputeResolved = async (
  show: ShowType,
  ticketId: string,
  decision: DisputeDecision,
  showQueue: ShowQueueType
) => {
  console.log('ticketDisputeResolved', ticketId, decision);
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
    }
  });

  showService.send({
    type: ShowMachineEventString.DISPUTE_RESOLVED,
    ticketId,
    decision
  });

  const ticketService = await getTicketMachineServiceFromId(
    ticketId,
    showQueue
  );

  ticketService.send({
    type: TicketMachineEventString.DISPUTE_RESOLVED,
    decision
  });
};

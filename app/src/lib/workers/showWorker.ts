import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { waitFor } from 'xstate/lib/waitFor';

import type {
  CancelType,
  DisputeType,
  FinalizeType,
  RefundType,
  SaleType
} from '$lib/models/common';
import { DisputeDecision } from '$lib/models/common';
import { Creator } from '$lib/models/creator';
import type { ShowDocument } from '$lib/models/show';
import { SaveState, Show, ShowStatus } from '$lib/models/show';
import { createShowEvent } from '$lib/models/showEvent';
import type { TicketDocument } from '$lib/models/ticket';
import { Ticket, TicketStatus } from '$lib/models/ticket';

import {
  createShowMachineService,
  ShowMachineEventString
} from '$lib/machines/showMachine';
import type { TicketMachineEventType } from '$lib/machines/ticketMachine';
import { TicketMachineEventString } from '$lib/machines/ticketMachine';
import { WalletMachineEventString } from '$lib/machines/walletMachine';

import Config from '$lib/config';
import { ActorType, EntityType } from '$lib/constants';
import { PayoutJobType } from '$lib/payment';
import {
  getTicketMachineService,
  getWalletMachineServiceFromId
} from '$lib/server/machinesUtil';

import type { PayoutQueueType } from './payoutWorker';

export type ShowJobDataType = {
  showId: string;
  [key: string]: any;
};

export type ShowQueueType = Queue<ShowJobDataType, any, ShowMachineEventString>;

export const getShowWorker = ({
  showQueue,
  payoutQueue,
  redisConnection
}: {
  showQueue: ShowQueueType;
  payoutQueue: PayoutQueueType;
  redisConnection: IORedis;
}) => {
  return new Worker(
    EntityType.SHOW,
    async (job: Job<ShowJobDataType, any, ShowMachineEventString>) => {
      const show = (await Show.findById(
        job.data.showId
      ).exec()) as ShowDocument;

      if (!show) {
        return 'No show found';
      }

      switch (job.name) {
        case ShowMachineEventString.CANCELLATION_INITIATED: {
          return cancelShow(show, job.data.cancel, showQueue);
        }
        case ShowMachineEventString.REFUND_INITIATED: {
          return refundShow(show, showQueue, payoutQueue);
        }
        case ShowMachineEventString.SHOW_STARTED: {
          return startShow(show);
        }
        case ShowMachineEventString.SHOW_ENDED: {
          return endShow(show, showQueue);
        }
        case ShowMachineEventString.SHOW_STOPPED: {
          return stopShow(show, showQueue);
        }
        case ShowMachineEventString.SHOW_FINALIZED: {
          return finalizeShow(show, job.data.finalize, showQueue);
        }

        // From Ticket Machine
        case ShowMachineEventString.CUSTOMER_JOINED: {
          return customerJoined(show, job.data.ticketId, job.data.customerName);
        }
        case ShowMachineEventString.CUSTOMER_LEFT: {
          return customerLeft(show, job.data.ticketId, job.data.customerName);
        }
        case ShowMachineEventString.TICKET_SOLD: {
          return ticketSold(
            show,
            job.data.ticketId,
            job.data.sale,
            job.data.customerName
          );
        }
        case ShowMachineEventString.TICKET_REDEEMED: {
          return ticketRedeemed(show, job.data.ticketId);
        }
        case ShowMachineEventString.TICKET_RESERVED: {
          return ticketReserved(show, job.data.ticketId, job.data.customerName);
        }
        case ShowMachineEventString.TICKET_REFUNDED: {
          return ticketRefunded(show, job.data.refund, job.data.ticketId);
        }
        case ShowMachineEventString.TICKET_CANCELLED: {
          return ticketCancelled(
            show,
            job.data.ticketId,
            job.data.customerName,
            job.data.cancel
          );
        }
        case ShowMachineEventString.TICKET_FINALIZED: {
          return ticketFinalized(show, job.data.ticketId, showQueue);
        }
        case ShowMachineEventString.TICKET_DISPUTED: {
          return ticketDisputed(show, job.data.dispute, job.data.ticketId);
        }
        case ShowMachineEventString.DISPUTE_DECIDED: {
          return ticketDisputeResolved(
            show,
            job.data.ticketId,
            job.data.decision,
            showQueue,
            payoutQueue
          );
        }

        default: {
          break;
        }
      }
    },
    { autorun: false, connection: redisConnection }
  );
};

const cancelShow = async (
  show: ShowDocument,
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
    'ticketState.active': true
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
  return 'success';
};

const refundShow = async (
  show: ShowDocument,
  showQueue: ShowQueueType,
  payoutQueue: PayoutQueueType
) => {
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
  if (showState.matches('initiatedCancellation.waiting2Refund')) {
    const tickets = await Ticket.find({
      show: show._id,
      'ticketState.active': true
    });
    for (const ticket of tickets) {
      // send refunds
      const ticketService = getTicketMachineService(ticket, showQueue);
      const ticketState = ticketService.getSnapshot();
      if (ticketState.matches('reserved.refundRequested')) {
        payoutQueue.add(PayoutJobType.REFUND_SHOW, {
          bcInvoiceId: ticket.bcInvoiceId,
          ticketId: ticket._id.toString()
        });
        ticketService.stop();
      }
    }
  }
  showService.stop();
  return 'success';
};

const startShow = async (show: ShowDocument) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction })
    }
  });
  showService.send(ShowMachineEventString.SHOW_STARTED);
  return 'success';
};

const stopShow = async (show: ShowDocument, showQueue: ShowQueueType) => {
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
    { delay: Config.TIMER.gracePeriod }
  );
  return 'success';
};

// End show, alert ticket
const endShow = async (show: ShowDocument, showQueue: ShowQueueType) => {
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
    const finalize = {
      finalizedAt: new Date(),
      finalizedBy: ActorType.TIMER
    };
    showQueue.add(
      ShowMachineEventString.SHOW_FINALIZED,
      {
        showId: show._id.toString(),
        finalize
      },
      { delay: Config.TIMER.escrowPeriod }
    );

    // Tell ticket holders the show is over folks
    const tickets = await Ticket.find({
      show: show._id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'ticketState.active': true
    });
    for (const ticket of tickets) {
      // send show is over
      const ticketService = getTicketMachineService(ticket, showQueue);
      ticketService.send(TicketMachineEventString.SHOW_ENDED);
      ticketService.stop();
    }
  }
  showService.stop();
  return 'success';
};

const finalizeShow = async (
  show: ShowDocument,
  finalize: FinalizeType,
  showQueue: ShowQueueType
) => {
  // Finalize show if not already finalized
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, transaction }) =>
        createShowEvent({ show, type, transaction })
    }
  });

  let updatedShow = show;

  const showState = showService.getSnapshot();

  if (
    !showState.can({
      type: ShowMachineEventString.SHOW_FINALIZED,
      finalize
    })
  )
    return;

  showService.send({
    type: ShowMachineEventString.SHOW_FINALIZED,
    finalize
  });

  // Finalize all the tickets, feedback or not
  const tickets = await Ticket.find({
    show: show._id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'ticketState.active': true
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

  // Calculate sales stats for show
  const showSession = await Show.startSession();

  await showSession.withTransaction(async () => {
    // aggregate all ticket stats
    // sales and refunds
    const ticketFilter = {
      show: show._id
    };

    const projectSales = {
      totalSales: {
        $objectToArray: '$ticketState.sale.totals'
      }
    };

    const unwindSales = {
      path: '$totalSales'
    };

    const groupBySales = {
      _id: '$totalSales.k',
      totalSales: { $sum: '$totalSales.v' }
    };

    const projectRefunds = {
      totalRefunds: {
        $objectToArray: '$ticketState.refund.totals'
      }
    };

    const unwindRefunds = {
      path: '$totalRefunds'
    };

    const groupByRefunds = {
      _id: '$totalRefunds.k',
      totalRefunds: { $sum: '$totalRefunds.v' }
    };

    const aggregateSalesAndRefunds = await Ticket.aggregate()
      .match(ticketFilter)
      .facet({
        sales: [
          { $project: projectSales },
          { $unwind: unwindSales },
          { $group: groupBySales }
        ],
        refunds: [
          { $project: projectRefunds },
          { $unwind: unwindRefunds },
          { $group: groupByRefunds }
        ]
      });

    const totalSales = new Map<string, number>();
    const totalRevenue = new Map<string, number>();
    for (const sale of aggregateSalesAndRefunds[0].sales) {
      totalSales.set(sale['_id'], sale['totalSales']);
      totalRevenue.set(sale['_id'], sale['totalSales']);
    }

    const totalRefunds = new Map<string, number>();
    for (const refund of aggregateSalesAndRefunds[0].refunds) {
      totalRefunds.set(refund['_id'], refund['totalRefunds']);
      const revenue = totalRevenue.get(refund['_id']);
      if (revenue) {
        totalRevenue.set(refund['_id'], revenue - refund['totalRefunds']);
      }
    }

    const ticketSalesAmount =
      show.showState.salesStats.ticketsSold * show.price.amount;

    updatedShow = (await Show.findByIdAndUpdate(
      { _id: show._id },
      {
        'showState.salesStats.ticketSalesAmount': {
          amount: ticketSalesAmount,
          currency: show.price.currency
        },
        'showState.salesStats.totalSales': totalSales,
        'showState.salesStats.totalRefunds': totalRefunds,
        'showState.salesStats.totalRevenue': totalRevenue
      },
      {
        returnDocument: 'after'
      }
    )) as ShowDocument;
    showSession.endSession();
  });

  // Calculate sales stats
  const creatorSession = await Creator.startSession();
  await creatorSession.withTransaction(async () => {
    const showFilter = {
      creator: show.creator,
      'showState.status': ShowStatus.FINALIZED
    };

    const projectSales = {
      totalSales: {
        $objectToArray: '$showState.salesStats.totalSales'
      }
    };

    const unwindSales = {
      path: '$totalSales'
    };

    const groupBySales = {
      _id: '$totalSales.k',
      totalSales: { $sum: '$totalSales.v' }
    };

    const projectRefunds = {
      totalRefunds: {
        $objectToArray: '$showState.salesStats.totalRefunds'
      }
    };

    const unwindRefunds = {
      path: '$totalRefunds'
    };

    const groupByRefunds = {
      _id: '$totalRefunds.k',
      totalRefunds: { $sum: '$totalRefunds.v' }
    };

    const projectTicketAmount = {
      ticketSalesAmounts: '$showState.salesStats.ticketSalesAmount'
    };

    const groupByTicketAmount = {
      _id: '$ticketSalesAmounts.currency',
      total: { $sum: '$ticketSalesAmounts.amount' }
    };

    const aggregateSalesAndRefunds = await Show.aggregate()
      .match(showFilter)
      .facet({
        numberOfCompletedShows: [
          {
            $group: {
              _id: '$show',
              count: { $sum: 1 }
            }
          }
        ],
        sales: [
          { $project: projectSales },
          { $unwind: unwindSales },
          { $group: groupBySales }
        ],
        refunds: [
          { $project: projectRefunds },
          { $unwind: unwindRefunds },
          { $group: groupByRefunds }
        ],
        ticketAmounts: [
          { $project: projectTicketAmount },
          { $group: groupByTicketAmount }
        ]
      });

    if (aggregateSalesAndRefunds.length === 0) {
      return 'No sales and refunds';
    }

    const totalSales = new Map<string, number>();
    const totalRevenue = new Map<string, number>();

    for (const sale of aggregateSalesAndRefunds[0].sales) {
      totalSales.set(sale['_id'], sale['totalSales']);
      totalRevenue.set(sale['_id'], sale['totalSales']);
    }

    const totalRefunds = new Map<string, number>();

    for (const refund of aggregateSalesAndRefunds[0].refunds) {
      totalRefunds.set(refund['_id'], refund['totalRefunds']);
      const revenue = totalRevenue.get(refund['_id']);
      if (revenue) {
        totalRevenue.set(refund['_id'], revenue - refund['totalRefunds']);
      }
    }

    const totalTicketSalesAmounts = new Map<string, number>();
    for (const ticketAmount of aggregateSalesAndRefunds[0].ticketAmounts) {
      totalTicketSalesAmounts.set(ticketAmount['_id'], ticketAmount['total']);
    }

    const numberOfCompletedShows =
      aggregateSalesAndRefunds[0].numberOfCompletedShows[0].count;

    await Creator.findByIdAndUpdate(
      { _id: show.creator },
      {
        'salesStats.numberOfCompletedShows': numberOfCompletedShows,
        'salesStats.totalRefunds': totalRefunds,
        'salesStats.totalRevenue': totalRevenue,
        'salesStats.totalSales': totalSales,
        'salesStats.totalTicketSalesAmounts': totalTicketSalesAmounts
      }
    );
    creatorSession.endSession();
  });

  // Update wallet with finalized show totals
  const creatorWallet = await Creator.findById(show.creator)
    .select('user.wallet')
    .exec();

  const walletId = creatorWallet?.user.wallet;
  if (!walletId) {
    console.log('No wallet to payout');
    return 'No wallet to payout';
  }

  const walletService = await getWalletMachineServiceFromId(
    walletId.toString()
  );

  walletService.send({
    type: WalletMachineEventString.SHOW_EARNINGS_POSTED,
    show: updatedShow
  });

  walletService.stop();
  return 'success';
};

// Ticket Events
const customerJoined = async (
  show: ShowDocument,
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
  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;
  showService.send({
    type: ShowMachineEventString.CUSTOMER_JOINED,
    ticket,
    customerName
  });
  return 'success';
};

const customerLeft = async (
  show: ShowDocument,
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
  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;
  showService.send({
    type: ShowMachineEventString.CUSTOMER_LEFT,
    ticket,
    customerName
  });
  return 'success';
};

const ticketSold = async (
  show: ShowDocument,
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
  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;

  showService.send({
    type: ShowMachineEventString.TICKET_SOLD,
    ticket,
    sale,
    customerName
  });
  return 'success';
};

const ticketRedeemed = async (show: ShowDocument, ticketId: string) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
    }
  });

  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;

  showService.send({
    type: ShowMachineEventString.TICKET_REDEEMED,
    ticket
  });
  return 'success';
};

const ticketReserved = async (
  show: ShowDocument,
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

  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;

  showService.send({
    type: ShowMachineEventString.TICKET_RESERVED,
    ticket,
    customerName
  });
  return 'success';
};

const ticketRefunded = async (
  show: ShowDocument,
  refund: RefundType,
  ticketId: string
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
    }
  });

  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;

  showService.send({
    type: ShowMachineEventString.TICKET_REFUNDED,
    refund,
    ticket
  });
  return 'success';
};

const ticketCancelled = async (
  show: ShowDocument,
  ticketId: string,
  customerName: string,
  cancel: CancelType
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

  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;

  showService.send({
    type: ShowMachineEventString.TICKET_CANCELLED,
    ticket,
    customerName,
    cancel
  });
  return 'success';
};

// Calculate feedback stats
const ticketFinalized = async (
  show: ShowDocument,
  ticketId: string,
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
  let showState = showService.getSnapshot();

  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;

  if (
    showState.can({
      type: ShowMachineEventString.TICKET_FINALIZED,
      ticket
    })
  ) {
    showService.send({
      type: ShowMachineEventString.TICKET_FINALIZED,
      ticket
    });
  }
  const showSession = await Show.startSession();

  await showSession.withTransaction(async () => {
    // aggregate ticket feedback into show
    const ticketFilter = {
      show: show._id,
      'ticketState.status': TicketStatus.FINALIZED,
      'ticketState.feedback': { $exists: true }
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
      return 'No feedback';
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
      return 'No feedback';
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

  const finalize = {
    finalizedAt: new Date(),
    finalizedBy: ActorType.CUSTOMER
  };
  // try to finalize show
  showState = showService.getSnapshot();
  if (
    showState.can({
      type: ShowMachineEventString.SHOW_FINALIZED,
      finalize
    })
  ) {
    showQueue.add(ShowMachineEventString.SHOW_FINALIZED, {
      showId: show._id.toString(),
      finalize
    });
  }
  return 'success';
};

const ticketDisputed = async (
  show: ShowDocument,
  dispute: DisputeType,
  ticketId: string
) => {
  const showService = createShowMachineService({
    showDocument: show,
    showMachineOptions: {
      saveStateCallback: async (showState) => SaveState(show, showState),
      saveShowEventCallback: async ({ type, ticketId, transaction }) =>
        createShowEvent({ show, type, ticketId, transaction })
    }
  });

  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;

  showService.send({
    type: ShowMachineEventString.TICKET_DISPUTED,
    dispute,
    ticket
  });
  return 'success';
};

const ticketDisputeResolved = async (
  show: ShowDocument,
  ticketId: string,
  decision: DisputeDecision,
  showQueue: ShowQueueType,
  payoutQueue: PayoutQueueType
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

  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;

  showService.send({
    type: ShowMachineEventString.DISPUTE_DECIDED,
    ticket,
    decision
  });

  const ticketService = getTicketMachineService(ticket, showQueue);

  if (decision === DisputeDecision.NO_REFUND) {
    ticketService.send({
      type: TicketMachineEventString.DISPUTE_DECIDED,
      decision
    });
  }

  // initiate refund if decided in favor of customer
  if (
    decision === DisputeDecision.FULL_REFUND ||
    decision === DisputeDecision.PARTIAL_REFUND
  ) {
    if (!ticket.ticketState.sale) {
      return 'No sale to refund';
    }

    const refund = ticket.ticketState.refund;
    if (!refund) {
      return 'No refund for dispute';
    }

    refund.approvedAmounts = new Map<string, number>(refund.requestedAmounts);

    if (decision === DisputeDecision.PARTIAL_REFUND) {
      for (const [key, value] of refund.requestedAmounts.entries()) {
        refund.approvedAmounts.set(key, value / 2);
      }
    }
    ticketService.send({
      type: TicketMachineEventString.DISPUTE_DECIDED,
      decision,
      refund
    });

    const waitState = await waitFor(ticketService, (state) =>
      state.matches('ended.inDispute.waiting4DisputeRefund')
    );
    console.log('waitState', waitState.value);
    console.log('waitState', waitState.context.ticketState.refund);

    payoutQueue.add(PayoutJobType.DISPUTE_PAYOUT, {
      ticketId: ticket._id.toString()
    });
    return 'success';
  }
};

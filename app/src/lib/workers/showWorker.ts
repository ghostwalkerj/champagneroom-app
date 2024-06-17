import type { Job, Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { waitFor } from 'xstate';

import { Agent, type AgentDocument } from '$lib/models/agent';
import {
  type CancelType,
  finalizeSchema,
  type FinalizeType
} from '$lib/models/common';
import { Creator, type CreatorDocument } from '$lib/models/creator';
import type { ShowDocument } from '$lib/models/show';
import { Show } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';

import { createShowMachineService } from '$lib/machines/showMachine';
import {
  createTicketMachineService,
  type TicketMachineEventType
} from '$lib/machines/ticketMachine';

import config from '$lib/config';
import {
  ActorType,
  DisputeDecision,
  EntityType,
  ShowStatus,
  TicketStatus,
  WalletMachineEventString
} from '$lib/constants';
import { PayoutJobType } from '$lib/payments';
import { getWalletMachineServiceFromId } from '$lib/server/machinesUtil';

import type { PayoutQueueType } from './payoutWorker';

export type ShowJobDataType = {
  showId: string;
  [key: string]: any;
};

export type ShowQueueType = Queue<ShowJobDataType, any, ShowWorkerJobType>;

export type ShowWorkerJobType =
  | 'CANCEL TICKETS'
  | 'REFUND TICKETS'
  | 'END ESCROW'
  | 'END SHOW'
  | 'CALCULATE STATS'
  | 'DISPUTE DECIDED';

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
    async (job: Job<ShowJobDataType, any, ShowWorkerJobType>) => {
      const show = (await Show.findById(
        job.data.showId
      ).exec()) as ShowDocument;

      if (!show) {
        return 'No show found';
      }

      switch (job.name) {
        case 'CANCEL TICKETS': {
          return cancelTickets(show, job.data.cancel, redisConnection);
        }
        case 'REFUND TICKETS': {
          return refundTickets(show, redisConnection, payoutQueue);
        }
        case 'END SHOW': {
          return endShow(show, showQueue, redisConnection);
        }
        case 'END ESCROW': {
          return endEscrow(show, redisConnection, job.data.finalize);
        }
        case 'CALCULATE STATS': {
          return calculateStats(show);
        }

        // From Ticket Machine
        case 'DISPUTE DECIDED': {
          return ticketDisputeResolved(
            show,
            job.data.ticketId,
            job.data.decision,
            redisConnection,
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

const cancelTickets = async (
  show: ShowDocument,
  cancel: CancelType,
  redisConnection: IORedis
) => {
  const tickets = (await Ticket.find({
    show: show._id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'ticketState.active': true
  })) as TicketDocument[];
  for (const ticket of tickets) {
    // send cancel show to all tickets
    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });
    const cancelEvent = {
      type: 'SHOW CANCELLED',
      cancel
    } as TicketMachineEventType;
    ticketService.send(cancelEvent);
    ticketService.stop();
  }
};

const refundTickets = async (
  show: ShowDocument,
  redisConnection: IORedis,
  payoutQueue: PayoutQueueType
) => {
  const showService = createShowMachineService({
    show,
    redisConnection
  });
  // Check if show needs to send refunds
  const showState = showService.getSnapshot();
  if (showState.matches({ initiatedCancellation: 'waiting2Refund' })) {
    const tickets = (await Ticket.find({
      show: show._id,
      'ticketState.active': true
    })) as TicketDocument[];
    for (const ticket of tickets) {
      // send refunds
      const ticketService = createTicketMachineService({
        ticket,
        show,
        redisConnection
      });
      const ticketState = ticketService.getSnapshot();
      if (ticketState.matches({ reserved: 'waiting4Refund' })) {
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

// End show, alert ticket
const endShow = async (
  show: ShowDocument,
  showQueue: ShowQueueType,
  redisConnection: IORedis
) => {
  const finalize = finalizeSchema.parse({
    finalizedBy: ActorType.TIMER
  });
  showQueue.add(
    'END ESCROW',
    {
      showId: show._id.toString(),
      finalize
    },
    { delay: config.TIMER.escrowPeriod }
  );

  // Tell ticket holders the show is over folks
  const tickets = (await Ticket.find({
    show: show._id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'ticketState.active': true
  })) as TicketDocument[];
  for (const ticket of tickets) {
    // send show is over
    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });
    const ticketState = ticketService.getSnapshot();
    if (ticketState.can({ type: 'SHOW ENDED' })) {
      ticketService.send({ type: 'SHOW ENDED' });
    }
    ticketService.stop();
  }
  return 'success';
};

// Timer to end escrow and finalize
const endEscrow = async (
  show: ShowDocument,
  redisConnection: IORedis,
  finalize: FinalizeType
): Promise<string> => {
  // Finalize all the tickets, feedback or not
  const tickets = (await Ticket.find({
    show: show._id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'ticketState.active': true
  })) as TicketDocument[];
  for (const ticket of tickets) {
    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });
    ticketService.send({
      type: 'TICKET FINALIZED',
      finalize
    });
    ticketService.stop();
  }
  return 'success';
};

const calculateStats = async (show: ShowDocument) => {
  const calculateSales = async (show: ShowDocument) => {
    // Calculate sales stats for show

    const showSession = await Show.startSession();
    let updatedShow = show;

    await showSession.withTransaction(async () => {
      // aggregate all ticket stats
      // sales and refunds
      const ticketFilter = {
        show: show._id
      };

      const projectSales = {
        totalSales: '$ticketState.sale.total'
      };

      const groupBySales = {
        _id: '$ticketState.sale.currency',
        totalSales: { $sum: '$totalSales' }
      };

      const projectRefunds = {
        totalRefunds: '$ticketState.refund.total'
      };

      const groupByRefunds = {
        _id: '$ticketState.sale.currency',
        totalRefunds: { $sum: '$totalRefunds' }
      };

      const aggregateSalesAndRefunds = await Ticket.aggregate()
        .match(ticketFilter)
        .facet({
          sales: [{ $project: projectSales }, { $group: groupBySales }],
          refunds: [{ $project: projectRefunds }, { $group: groupByRefunds }]
        });

      for (const sale of aggregateSalesAndRefunds[0].sales) {
        show.showState.salesStats.totalSales[sale['_id']] = sale['totalSales'];
        show.showState.salesStats.totalRevenue[sale['_id']] =
          sale['totalSales'];
      }

      for (const refund of aggregateSalesAndRefunds[0].refunds) {
        show.showState.salesStats.totalRefunds[refund['_id']] =
          refund['totalRefunds'];
        const revenue = show.showState.salesStats.totalRevenue[refund['_id']];
        if (revenue) {
          show.showState.salesStats.totalRevenue[refund['_id']] =
            revenue - refund['totalRefunds'];
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
          'showState.salesStats.totalSales':
            show.showState.salesStats.totalSales,
          'showState.salesStats.totalRefunds':
            show.showState.salesStats.totalRefunds,
          'showState.salesStats.totalRevenue':
            show.showState.salesStats.totalRevenue
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
    const creator = (await Creator.findById(
      show.creator
    ).exec()) as CreatorDocument;

    if (!creator) {
      console.error('No creator found');
      return 'No creator found';
    }

    const walletId = creator.user.wallet;
    if (!walletId) {
      console.error('No wallet to payout');
      return 'No wallet to payout';
    }

    const walletService = await getWalletMachineServiceFromId(
      walletId.toString()
    );

    walletService.send({
      type: WalletMachineEventString.SHOW_EARNINGS_POSTED,
      show: updatedShow,
      creator
    });

    walletService.stop();

    //Send commission to agent
    if (creator.agent && creator.commissionRate > 0) {
      const agent = (await Agent.findById(
        creator.agent
      ).exec()) as AgentDocument;
      if (agent && agent.user.wallet) {
        const walletService = await getWalletMachineServiceFromId(
          agent.user.wallet.toString()
        );
        walletService.send({
          type: WalletMachineEventString.SHOW_COMMISSION_POSTED,
          show: updatedShow,
          creator
        });
        walletService.stop();
      }
    }
    return 'success';
  };
  const calculateFeedback = async (show: ShowDocument) => {
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

      await Show.findByIdAndUpdate(
        { _id: show._id },
        {
          'showState.feedbackStats': {
            averageRating,
            numberOfReviews,
            comments
          }
        }
      ),
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

    return 'success';
  };
  await calculateSales(show);
  await calculateFeedback(show);
};

const ticketDisputeResolved = async (
  show: ShowDocument,
  ticketId: string,
  decision: DisputeDecision,
  redisConnection: IORedis,
  payoutQueue: PayoutQueueType
) => {
  const showService = createShowMachineService({
    show,
    redisConnection
  });
  const ticket = (await Ticket.findById(ticketId).exec()) as TicketDocument;
  showService.send({
    type: 'DISPUTE DECIDED',
    decision,
    ticket
  });
  const ticketService = createTicketMachineService({
    ticket,
    show,
    redisConnection
  });
  if (decision === DisputeDecision.NO_REFUND) {
    ticketService.send({
      type: 'DISPUTE DECIDED',
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
    if (decision === DisputeDecision.PARTIAL_REFUND) {
      refund.approvedAmount = refund.requestedAmount / 2;
    }
    ticketService.send({
      type: 'DISPUTE DECIDED',
      decision,
      refund
    });

    await waitFor(ticketService, (state) =>
      state.matches({ ended: { inDispute: 'waiting4DisputeRefund' } })
    );
    payoutQueue.add(PayoutJobType.DISPUTE_PAYOUT, {
      ticketId: ticket._id.toString()
    });
    showService.stop();
    ticketService.stop();
    return 'success';
  }
};

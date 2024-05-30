/* eslint-disable @typescript-eslint/naming-convention */

import type { Queue } from 'bullmq';
import { nanoid } from 'nanoid';
import { assign, createActor, raise, setup, type StateFrom } from 'xstate';

import type {
  DisputeType,
  FeedbackType,
  FinalizeType,
  RefundType,
  TransactionSummaryType
} from '$lib/models/common';
import {
  type CancelType,
  escrowSchema,
  finalizeSchema,
  redemptionSchema,
  refundSchema,
  type SaleType,
  ticketSaleSchema,
  transactionSummarySchema
} from '$lib/models/common';
import type { TicketDocument } from '$lib/models/ticket';
import type { TransactionDocument } from '$lib/models/transaction';

import type { ShowJobDataType } from '$lib/workers/showWorker';

import type { CurrencyType } from '$lib/constants';
import {
  ActorType,
  DisputeDecision,
  RefundReason,
  TicketStatus
} from '$lib/constants';
import { calcTotal } from '$lib/payout.js';

type TicketMachineContextType = {
  ticket: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
  errorMessage: string | undefined;
  id: string;
};

export type TicketMachineEventType =
  | {
      type: 'CANCELLATION REQUESTED';
      cancel: CancelType;
    }
  | {
      type: 'REFUND RECEIVED';
      transaction: TransactionDocument;
    }
  | {
      type: 'REFUND REQUESTED';
      refund: RefundType;
    }
  | {
      type: 'REFUND INITIATED';
      refund: RefundType;
    }
  | {
      type: 'PAYMENT RECEIVED';
      transaction: TransactionDocument;
    }
  | {
      type: 'FEEDBACK RECEIVED';
      feedback: FeedbackType;
    }
  | {
      type: 'DISPUTE INITIATED';
      dispute: DisputeType;
      refund: RefundType;
    }
  | {
      type: 'TICKET REDEEMED';
    }
  | {
      type: 'SHOW JOINED';
    }
  | {
      type: 'SHOW LEFT';
    }
  | {
      type: 'SHOW ENDED';
    }
  | {
      type: 'SHOW CANCELLED';
      cancel: CancelType;
    }
  | {
      type: 'TICKET FINALIZED';
      finalize: FinalizeType;
    }
  | {
      type: 'DISPUTE DECIDED';
      decision: DisputeDecision;
      refund?: RefundType;
    }
  | {
      type: 'PAYMENT INITIATED';
      paymentCurrency: CurrencyType;
    };

export type TicketMachineOptions = {
  gracePeriod?: number;
  escrowPeriod?: number;
  showQueue?: Queue<ShowJobDataType, any, string>;
  saveState?: boolean;
};

const createTicketMachine = ({
  ticket,
  ticketMachineOptions
}: {
  ticket: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
}) => {
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAxAMoASA8gOoAEAogHIAiLHA2gAwBdRKAAOAe1io0Y0sJAAPRABYATABoQAT0QAOAIwA6AGwB2JQE4TOnXwCsts+aUBfZxrRYcBYmTAGP2MgAMmL4EJAU-EJIIOKS0rIxiggqJoYqSgDMVnp8fEq2Rqoa2il6OioGSrl8+vbmDnqu7hiB3iTk-q04IWERPHrRohJSqDJyySrm6Vk5eQVF6lqIqU4GKjqZekYqRg3NIAFehB1+R8Gh4RCRKkOxIwkTK-rrs-rzhcXLKSq7BiYmXYmWzbPi-HRGA7ndq+LqeC59a48TJ3OKjcZJRCZPgzbLvfKfJalDaZHTGAr2MzbUx8ExQ7p4E6w869K6RJSoh5jRKgSZGXFzAmLEorPSkgz5ExGCGbEzmHH0+Ewzosy79Wyc+Lcp4pEGvPE1BaqTIilJ8cyZYw6WxTFR6bYqbEuNyHBnKs4M1n9Iya9E8hQrar6wVGx2mvRKMxVSzWqbzfSQl3Qpkqz1qpEmX2PTEpLbB-Ghk3fCPYgxim22cxTcwVJTOlpKlMe+FepE6LPanPYgUFwmmjabCW1PQgnEmTIbRVtJtwwKtyLmDsY3minuGwlF0pioPVPKA83W822KfHHyplvpyK5Jf+yY4-PrxablbSgyFDI6VT5R0OE+Ms-NnOl4DIMchotmK4-GuHxPuGpK2P8gJGEYhTmNMph-u6s49MBei3GBXLLgGCB6NMD4wca-YZGWaFofM2JpFWmEzgATnAYAsQAbhEtCMEwADCACCbD8SwQRBNwUQEVqRHJPy5gSvomTofKOiAno-Z2ApSj5COmSVhUtTMQBBhsbAHHcdcvHMEJIliRJvCgTE4GdpB+koUOtKbKkWS7P2dYKQ4ewWGK-IfsZpymexXGQAYADu+CjKQUBKAACvgmgALZgKQyAULZoniYJAAqACSdBsEwABKLAAIoAKosFQxWSYI0l+jq+nAp5VgTmYE5GP2qHGBGIIWDo5hGNiiYNtOJlmRZsUJUlKXpVlOV5algkAJq4OwxVMKVbClWVJWtTeOqTZa1TTNYEIqLYkYad8D14QYk2LJYtjKWCEWwgtMUQAYZCjPgyCQGt2W5RQW27ft1UsKJpUAGrne1EHEeWfBvnsehmLsY0NP5EJlhStjfjaqR-Z0AOWcDpCg+DECQxtMM7XtbAHTVSOo45F05ljOPTPjKERkTL2ZHWVTfZYpFGHYDiZNTfi07FbHoGAqCWSz0OwxzXOIywKNo85hG3ogpFkUoewqHktJgpGz65njxiZFsVa0mKUrK1F5mA1FGtaxDGVQ5t7Pw9zRu8wM-OQdsaQSqRpLy9b0q2FR8tVEaOx5BOVNJm6rHRXT6ua9rIeszVABi9WcAjDVNS1vBtabMnmyRaGGNbHt7g747hgCSgGPpOlxshE3lD7qtA8taDJUoVBEGIcUUGV-EANIsAbXAsHtzex8RXUIXbvU+QN-bSgpovWHL1THgXjbzcXS2JXPKWL8vFDV7XHD141zUm2GG3HUGQPIZGUqoAEgI3ZO1ItsAwal5Q6SdKSCEU9n4z1fmQd+S8V7fzrjVBuAC+bo1cofewx89zeX6n5CWfBLT2Ftm7R6Th9IqHQX7EuYAABmABXUgEAqpgAAI68LgEzL+LAa51yOidUqZ196kNkliMcCDgrKQnFsSM4ZpiVG+iOX4lgpqTTpA-OakVp7xSwfPIRfCBGSOkb-SOxtFGtw6l2ChPVqG+UGsWRB6wawZABBNCEWQOGLUwStJQtj+HXHwU4w2LiY5KPbhOe0w99D6EmiOC05hwwVDJDad26l+Q7CVmY08FjIBgDANlKy9BmASSrsVKSbiMbJB0gUROtE1Lk2QrYHQ-YchVDBPkHENYQQ6HQeEWpPEGlMAAFJ0COoA+4wCuw1mxnwPYgIMgK2esSaUJhh6UztJsUpaCKn-kijlNka9N4HSrkdQSQRSoAC1VkuWUSRI5xhyapDMACDYShBnfDlMcp0pE6zKQ9vWV0j8bkCNimQFgsB0AsU-lXFg3AABCgkN4Ix5p8s2Oo8LkzLJTXI9o5S51NBAtRal6Ej2tqScps1Kmwluci0gqL0Wfw4KVKgqV6otUOsdU6TdWlAPcZBEwtQRq9NMD9NSBysQk3AcCfkdZcZNCuVhLlQMUVooxSvKVayZXETlWSfkirxyqTSKaPp6x9C-ABFWTI-J77suuZypFhrSAcFQLAEQvDwZWKiRwMA6Ag3cgoAKoVIqWBMC4PxUqXBXHSvaYgQFw9tm-FpF+YEpoLRd0sPKeUew3b0J9ga+mgbg2hr8LPbBShI3RskDIONgrhWipTWmySTlM1kOSLkC0ZYdj2C2J+VVJF6FDyCcCbZNYdIzXheY31Vw61BpDWG5t89607rADE+x8TCVR2JesuO1RjmmH+ZNWo2zzTFtUMPZCBQtgeuyL9PVM5a2ZSDeZCAH8V7xp7Um2REqL0WuSOTY+WRpQrqlCOcMtsjCIQmvKUBRRkKuBdKQMQ4R4AxGTABFJOoAC0vjSjkYQrROj9HZQ+1VIiMjOYvjEghJaSauxrDYlJPB8JgNWOQUaIpMUKlajqXDNKNDph5T-P5FsUx3qsKWL3atCuuVhOWoqG+LIDQdjbE2PYIaQZkJFHJspZCJjBN0xBmgMGwd1pabacOi2eNLRSjzvYehAJpRDQ2EOF12GIRats2rKNZcnOh20yOqkikbCkm2I9al-Z9LaQMzJ4EWwMI-qfpwl+UTgOxZWAxP5KF0J4jtE7B6ksqiobtFKeWeFV0kaqQVoGbE7GCJEWI2ATMSspFlAgpwI5-nAntLAi0Q9MlOGBHavq4XIlv2iTw2Jg2JwvDFKRV6cnaw6NSG+ccdpJrTBHK1wuT8Zl1I25YIep3ChjmtBNEw-ZrDYwKA1pVIJtg+3QPgUgGsAA2QPIC3byK+mM5poG1HThLP4aFas7D2Dan23CyD4CB6gAAXmD1z3zyifmHrVtIhkYVUYtqSY5+bSl5F2L5mtfrBsFGOfkD1n5tlIbh8SGsOM1IAjdmdqajPN1Gr5XFQbKX0MtclpLR0oLSgggUhW3YHtwUKjy4i0XAbt2NsG3sBS018341pNz3QWQEGGOxLsbI9gLsIo3dyg9jbw0rbbTGoiXz26bGxgTKamxSLjKJBbOwaHvo2ilGzz8NYRdO917u6xKVnfg2PRAQbEYwRvgyB7Zl0xYGc5GTpcoNYaxSnYZrx3QN-2wEA8V-H3uprDzJXjAxktTCmgq8PSMDRPxyiKPsXDQA */
  return setup({
    types: {
      events: {} as TicketMachineEventType,
      context: {} as TicketMachineContextType
    },
    actions: {
      sendJoinedShow: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add('CUSTOMER JOINED', {
          showId: params.ticket.show.toString(),
          ticketId: params.ticket._id.toString()
        });
      },

      sendLeftShow: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add('CUSTOMER LEFT', {
          showId: params.ticket.show.toString(),
          ticketId: params.ticket._id.toString()
        });
      },

      sendTicketSold: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add('TICKET SOLD', {
          showId: params.ticket.show.toString(),
          ticketId: params.ticket._id.toString(),
          sale: params.ticket.ticketState.sale
        });
      },

      sendTicketRedeemed: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add('TICKET REDEEMED', {
          showId: params.ticket.show.toString(),
          ticketId: params.ticket._id.toString()
        });
      },

      sendTicketRefunded: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add('TICKET REFUNDED', {
          showId: params.ticket.show.toString(),
          ticketId: params.ticket._id.toString(),
          refund: params.ticket.ticketState.refund
        });
      },

      sendTicketCancelled: (
        _,
        params: { cancel: CancelType; ticket: TicketDocument }
      ) => {
        ticketMachineOptions?.showQueue?.add('TICKET CANCELLED', {
          showId: ticket.show.toString(),
          ticketId: ticket._id.toString(),
          customerName: ticket.user.name,
          cancel: params.cancel
        });
      },

      sendTicketFinalized: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add('TICKET FINALIZED', {
          showId: params.ticket.show.toString(),
          ticketId: params.ticket._id.toString()
        });
      },

      sendDisputeInitiated: (_, params: { ticket: TicketDocument }) => {
        ticketMachineOptions?.showQueue?.add('TICKET DISPUTED', {
          showId: params.ticket.show.toString(),
          ticketId: params.ticket._id.toString(),
          dispute: params.ticket.ticketState.dispute
        });
      },

      requestRefundCancelledShow: (
        _,
        params: { cancel: CancelType; ticket: TicketDocument }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.REFUND_REQUESTED;
          ticket.ticketState.cancel = params.cancel;
          ticket.ticketState.refund = refundSchema.parse({
            requestedAmounts: ticket.ticketState.sale?.total,
            approvedAmounts: ticket.ticketState.sale?.total,
            reason: RefundReason.SHOW_CANCELLED
          });
          return {
            ticket
          };
        });
      },

      initiatePayment: (
        _,
        params: { ticket: TicketDocument; paymentCurrency: CurrencyType }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const paymentCurrency = params.paymentCurrency;
          ticket.ticketState.status = TicketStatus.PAYMENT_INITIATED;
          ticket.ticketState.sale = ticketSaleSchema.parse({
            totals: {
              [paymentCurrency]: 0
            },
            payments: [],
            currency: paymentCurrency
          }) as SaleType;
          return {
            ticket
          };
        });
      },

      setFullyPaid: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.FULLY_PAID;
          return { ticket };
        });
      },

      redeemTicket: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          if (ticket.ticketState.status === TicketStatus.REDEEMED)
            return { ticket };
          ticket.ticketState.status = TicketStatus.REDEEMED;
          ticket.ticketState.redemption = redemptionSchema.parse({});
          return { ticket };
        });
      },

      cancelTicket: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.CANCELLED;
          return { ticket };
        });
      },

      receivePayment: (
        _,
        params: {
          ticket: TicketDocument;
          transaction: TransactionDocument;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const transaction = params.transaction;
          if (!ticket.ticketState.sale) return { ticket };
          const payment = transactionSummarySchema.parse({
            amount: transaction.amount,
            currency: transaction.currency.toUpperCase() as CurrencyType,
            rate: +(transaction.rate || 0),
            transaction: transaction._id
          });
          ticket.$inc('ticketState.sale.total', payment.amount);
          ticket.ticketState.sale.payments.push(payment);
          ticket.ticketState.status = TicketStatus.PAYMENT_RECEIVED;
          return { ticket };
        });
      },

      requestRefund: (
        _,
        params: {
          ticket: TicketDocument;
          refund: RefundType;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const refund = params.refund;
          ticket.ticketState.status = TicketStatus.REFUND_REQUESTED;
          ticket.ticketState.refund = refund;
          return { ticket };
        });
      },

      initiateRefund: (
        _,
        params: {
          ticket: TicketDocument;
          refund: RefundType;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const refund = params.refund;
          ticket.ticketState.status = TicketStatus.WAITING_FOR_REFUND;
          ticket.ticketState.refund = refund;
          return { ticket };
        });
      },

      receiveRefund: (
        _,
        params: {
          ticket: TicketDocument;
          transaction: TransactionDocument;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const transaction = params.transaction;
          if (!ticket.ticketState.refund) return { ticket };
          const currency = transaction.currency.toUpperCase();
          const payout = transactionSummarySchema.parse({
            amount: +transaction.amount,
            currency,
            rate: +(transaction.rate || 0),
            transaction: transaction._id
          });
          ticket.ticketState.refund.payouts.push(payout);
          ticket.$inc('ticketState.refund.total', payout.amount);
          return { ticket };
        });
      },

      receiveFeedback: (
        _,
        params: {
          ticket: TicketDocument;
          feedback: FeedbackType;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const feedback = params.feedback;
          ticket.ticketState.feedback = feedback;
          return { ticket };
        });
      },

      initiateDispute: (
        _,
        params: {
          ticket: TicketDocument;
          dispute: DisputeType;
          refund: RefundType;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          if (!ticket.ticketState.sale) return { ticket };
          ticket.ticketState.status = TicketStatus.IN_DISPUTE;
          ticket.ticketState.dispute = params.dispute;
          ticket.ticketState.refund = params.refund;
          return { ticket };
        });
      },

      endShow: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.IN_ESCROW;
          ticket.ticketState.escrow = escrowSchema.parse({});
          return { ticket };
        });
      },

      finalizeTicket: (
        _,
        params: {
          ticket: TicketDocument;
          finalize: FinalizeType;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const finalize = params.finalize;
          if (ticket.ticketState.status === TicketStatus.FINALIZED)
            return { ticket };

          ticket.ticketState.status = TicketStatus.FINALIZED;
          ticket.ticketState.finalize = finalize;
          return { ticket };
        });
      },

      decideDispute: (
        _,
        params: {
          ticket: TicketDocument;
          decision: DisputeDecision;
          refund?: RefundType;
        }
      ) => {
        assign(() => {
          const ticket = params.ticket;
          const decision = params.decision;
          const refund = params.refund;

          if (!ticket.ticketState.dispute) return { ticket };
          ticket.ticketState.dispute.decision = decision;
          ticket.ticketState.dispute.endedAt = new Date();
          ticket.ticketState.dispute.resolved = true;
          if (refund) ticket.ticketState.refund = refund;
          ticket.ticketState.status = TicketStatus.WAITING_FOR_DISPUTE_REFUND;
          return { ticket };
        });
      },

      deactivateTicket: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.active = false;
          return { ticket };
        });
      },

      missShow: (_, params: { ticket: TicketDocument }) => {
        assign(() => {
          const ticket = params.ticket;
          ticket.ticketState.status = TicketStatus.MISSED_SHOW;
          return { ticket };
        });
      }
    },
    guards: {
      ticketCancelled: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.CANCELLED,
      ticketFinalized: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.FINALIZED,
      ticketInDispute: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.IN_DISPUTE,
      ticketInEscrow: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.IN_ESCROW,
      ticketReserved: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.RESERVED,
      ticketRedeemed: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.REDEEMED,
      ticketHasPaymentInitiated: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.PAYMENT_INITIATED,
      ticketHasPayment: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.PAYMENT_RECEIVED,
      ticketFullyPaid: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.FULLY_PAID,
      ticketHasRefundRequested: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.REFUND_REQUESTED,
      ticketIsWaitingForRefund: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.WAITING_FOR_REFUND,
      ticketMissedShow: ({ context }) =>
        context.ticket.ticketState.status === TicketStatus.MISSED_SHOW,
      ticketInDisputeRefund: ({ context }) =>
        context.ticket.ticketState.status ===
        TicketStatus.WAITING_FOR_DISPUTE_REFUND,
      fullyPaid: (
        { context, event },
        params: { transaction: TransactionDocument }
      ) => {
        const { transaction } = params;
        const amount =
          event.type === 'PAYMENT RECEIVED' ? +transaction.amount : 0;
        let total = +(amount * +(transaction.rate || 0)).toFixed(0);

        // Check total payments with rates at time of transaction.
        const payouts = (context.ticket.ticketState.sale?.payments ||
          new Map<string, TransactionSummaryType[]>()) as Map<
          string,
          TransactionSummaryType[]
        >;
        total += calcTotal(payouts);
        return total >= context.ticket.price.amount;
      },
      showMissed: ({ context }) => {
        return (
          context.ticket.ticketState.redemption === undefined ||
          context.ticket.ticketState.redemption?.redeemedAt === undefined
        );
      },
      fullyRefunded: ({ context, event }) => {
        const refund = context.ticket.ticketState.refund;
        if (refund === undefined) return false;
        const refundApproved = refund.approvedAmount || 0;
        if (refundApproved === 0) return false;
        const amount =
          event.type === 'REFUND RECEIVED' ? +event.transaction?.amount : 0;
        const totalRefundsAmount = refund.total || 0 + amount;

        const refundedInTransactionCurrency =
          totalRefundsAmount >= refundApproved;

        return refundedInTransactionCurrency;
      },
      canWatchShow: ({ context }) => {
        return (
          context.ticket.ticketState.status === TicketStatus.REDEEMED ||
          context.ticket.ticketState.status === TicketStatus.FULLY_PAID
        );
      },
      canBeRefunded: ({ context }) => {
        const currency = context.ticket.price.currency;

        return (
          context.ticket.price.amount !== 0 &&
          (!context.ticket.ticketState.sale ||
            !context.ticket.ticketState.sale?.payments ||
            (context.ticket.ticketState.sale?.payments as any)[currency]
              ?.length === 0)
        );
      },

      noDisputeRefund: ({ context }, params: { decision: DisputeDecision }) => {
        const decision =
          context.ticket.ticketState.dispute?.decision || params.decision;
        if (!decision) return false;
        return decision === DisputeDecision.NO_REFUND;
      }
    }
  }).createMachine({
    context: {
      ticket,
      ticketMachineOptions,
      errorMessage: undefined as string | undefined,
      id: nanoid()
    },
    id: 'ticketMachine',
    initial: 'ticketLoaded',
    states: {
      ticketLoaded: {
        always: [
          {
            target: '#ticketMachine.reserved',
            guard: 'ticketReserved'
          },
          {
            target: '#ticketMachine.reserved.initiatedPayment',
            guard: 'ticketHasPaymentInitiated'
          },
          {
            target: '#ticketMachine.reserved.receivedPayment',
            guard: 'ticketHasPayment'
          },
          {
            target: '#ticketMachine.reserved.waiting4Show',
            guard: 'ticketFullyPaid'
          },
          {
            target: '#ticketMachine.reserved.refundRequested',
            guard: 'ticketHasRefundRequested'
          },
          {
            target: '#ticketMachine.reserved.waiting4Refund',
            guard: 'ticketIsWaitingForRefund'
          },
          {
            target: 'cancelled',
            guard: 'ticketCancelled'
          },
          {
            target: 'finalized',
            guard: 'ticketFinalized'
          },
          {
            target: 'redeemed',
            guard: 'ticketRedeemed'
          },
          {
            target: '#ticketMachine.ended.inEscrow',
            guard: 'ticketInEscrow'
          },
          {
            target: '#ticketMachine.ended.inDispute',
            guard: 'ticketInDispute'
          },
          {
            target: '#ticketMachine.ended.missedShow',
            guard: 'ticketMissedShow'
          },
          {
            target: '#ticketMachine.ended.inDispute.waiting4DisputeRefund',
            guard: 'ticketInDisputeRefund'
          }
        ]
      },
      reserved: {
        initial: 'waiting4Payment',
        states: {
          waiting4Payment: {
            on: {
              'CANCELLATION REQUESTED': {
                target: '#ticketMachine.cancelled',
                actions: [
                  {
                    type: 'cancelTicket',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      cancel: event.cancel
                    })
                  },
                  {
                    type: 'sendTicketCancelled',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      cancel: event.cancel
                    })
                  }
                ]
              },
              'PAYMENT INITIATED': {
                target: '#ticketMachine.reserved.initiatedPayment',
                actions: [
                  {
                    type: 'initiatePayment',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      paymentCurrency: event.paymentCurrency
                    })
                  }
                ]
              }
            }
          },
          initiatedPayment: {
            on: {
              'PAYMENT RECEIVED': [
                {
                  target: '#ticketMachine.reserved.waiting4Show',
                  guard: {
                    type: 'fullyPaid',
                    params: ({ event }) => ({
                      transaction: event.transaction
                    })
                  },
                  actions: [
                    {
                      type: 'receivePayment',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    },
                    {
                      type: 'setFullyPaid',
                      params: ({ context }) => ({
                        ticket: context.ticket
                      })
                    },
                    {
                      type: 'sendTicketSold',
                      params: ({ context }) => ({
                        ticket: context.ticket
                      })
                    }
                  ]
                },
                {
                  target: '#ticketMachine.reserved.receivedPayment',
                  actions: [
                    {
                      type: 'receivePayment',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    }
                  ]
                }
              ]
            }
          },
          receivedPayment: {
            // under paid
            on: {
              'PAYMENT RECEIVED': [
                {
                  target: '#ticketMachine.reserved.waiting4Show',
                  guard: {
                    type: 'fullyPaid',
                    params: ({ event }) => ({
                      transaction: event.transaction
                    })
                  },
                  actions: [
                    {
                      type: 'receivePayment',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    },
                    {
                      type: 'setFullyPaid',
                      params: ({ context }) => ({ ticket: context.ticket })
                    },
                    {
                      type: 'sendTicketSold',
                      params: ({ context }) => ({ ticket: context.ticket })
                    }
                  ]
                },
                {
                  actions: [
                    {
                      type: 'receivePayment',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    }
                  ]
                }
              ],
              'REFUND REQUESTED': {
                target: 'refundRequested',
                actions: [
                  {
                    type: 'requestRefund',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      refund: event.refund
                    })
                  }
                ]
              }
            }
          },
          waiting4Show: {
            on: {
              'TICKET REDEEMED': {
                target: '#ticketMachine.redeemed',
                guard: 'canWatchShow',
                actions: [
                  {
                    type: 'redeemTicket',
                    params: ({ context }) => ({
                      ticket: context.ticket
                    })
                  },
                  {
                    type: 'sendTicketRedeemed',
                    params: ({ context }) => ({
                      ticket: context.ticket
                    })
                  }
                ]
              },
              'REFUND REQUESTED': [
                {
                  target: 'refundRequested',
                  actions: [
                    {
                      type: 'requestRefund',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        refund: event.refund
                      })
                    }
                  ],
                  guard: 'canBeRefunded'
                },
                {
                  target: '#ticketMachine.cancelled',
                  actions: [
                    {
                      type: 'requestRefund',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        refund: event.refund
                      })
                    },
                    {
                      type: 'cancelTicket',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        refund: event.refund
                      })
                    },
                    {
                      type: 'sendTicketRefunded',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        refund: event.refund
                      })
                    }
                  ]
                }
              ]
            }
          },
          refundRequested: {
            on: {
              'REFUND INITIATED': {
                target: 'waiting4Refund',
                actions: [
                  {
                    type: 'initiateRefund',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      refund: event.refund
                    })
                  }
                ]
              }
            }
          },
          waiting4Refund: {
            on: {
              'REFUND RECEIVED': [
                {
                  target: '#ticketMachine.cancelled',
                  guard: 'fullyRefunded',
                  actions: [
                    {
                      type: 'receiveRefund',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    },
                    {
                      type: 'cancelTicket',
                      params: ({ context }) => ({
                        ticket: context.ticket
                      })
                    },
                    {
                      type: 'sendTicketRefunded',
                      params: ({ context }) => ({
                        ticket: context.ticket
                      })
                    }
                  ]
                },
                {
                  actions: [
                    {
                      type: 'receiveRefund',
                      params: ({ context, event }) => ({
                        ticket: context.ticket,
                        transaction: event.transaction
                      })
                    }
                  ]
                }
              ]
            }
          }
        },
        on: {
          'SHOW CANCELLED': [
            {
              target: '#ticketMachine.reserved.refundRequested',
              actions: [
                {
                  type: 'requestRefundCancelledShow',
                  params: ({ context, event }) => ({
                    ticket: context.ticket,
                    cancel: event.cancel
                  })
                }
              ],
              guard: 'canBeRefunded'
            },
            {
              target: '#ticketMachine.cancelled',
              actions: [
                {
                  type: 'cancelTicket',
                  params: ({ context }) => ({
                    ticket: context.ticket
                  })
                },
                {
                  type: 'sendTicketCancelled',
                  params: ({ context, event }) => ({
                    ticket: context.ticket,
                    cancel: event.cancel
                  })
                }
              ]
            }
          ]
        }
      },
      redeemed: {
        on: {
          'SHOW LEFT': {
            actions: [
              {
                type: 'sendLeftShow',
                params: ({ context }) => ({
                  ticket: context.ticket
                })
              }
            ]
          },
          'SHOW JOINED': {
            guard: 'canWatchShow',
            actions: [
              {
                type: 'sendJoinedShow',
                params: ({ context }) => ({
                  ticket: context.ticket
                })
              }
            ]
          }
        }
      },
      cancelled: {
        type: 'final',
        entry: [
          {
            type: 'deactivateTicket',
            params: ({ context }) => ({
              ticket: context.ticket
            })
          }
        ]
      },
      finalized: {
        type: 'final',
        entry: [
          {
            type: 'deactivateTicket',
            params: ({ context }) => ({
              ticket: context.ticket
            })
          }
        ]
      },
      ended: {
        initial: 'inEscrow',
        on: {
          'TICKET FINALIZED': {
            target: '#ticketMachine.finalized',
            actions: [
              {
                type: 'finalizeTicket',
                params: ({ context, event }) => ({
                  ticket: context.ticket,
                  finalize: event.finalize
                })
              },
              {
                type: 'sendTicketFinalized',
                params: ({ context, event }) => ({
                  ticket: context.ticket,
                  finalize: event.finalize
                })
              }
            ]
          }
        },
        states: {
          inEscrow: {
            always: [
              {
                target: 'missedShow',
                guard: 'showMissed',
                actions: [
                  {
                    type: 'missShow',
                    params: ({ context }) => ({
                      ticket: context.ticket
                    })
                  }
                ]
              }
            ],
            on: {
              'FEEDBACK RECEIVED': {
                actions: [
                  {
                    type: 'receiveFeedback',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      feedback: event.feedback
                    })
                  },
                  raise({
                    type: 'TICKET FINALIZED',
                    finalize: finalizeSchema.parse({
                      finalizedBy: ActorType.CUSTOMER
                    })
                  })
                ]
              },
              'DISPUTE INITIATED': {
                target: 'inDispute',
                actions: [
                  {
                    type: 'initiateDispute',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      dispute: event.dispute,
                      refund: event.refund
                    })
                  },
                  {
                    type: 'sendDisputeInitiated',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      dispute: event.dispute
                    })
                  }
                ]
              }
            }
          },
          inDispute: {
            initial: 'waiting4Decision',
            states: {
              waiting4Decision: {
                on: {
                  'DISPUTE DECIDED': [
                    {
                      actions: [
                        {
                          type: 'decideDispute',
                          params: ({ context, event }) => ({
                            ticket: context.ticket,
                            decision: event.decision,
                            refund: event.refund
                          })
                        },
                        raise({
                          type: 'TICKET FINALIZED',
                          finalize: finalizeSchema.parse({
                            finalizedBy: ActorType.ARBITRATOR
                          })
                        })
                      ],
                      guard: {
                        type: 'noDisputeRefund',
                        params: ({ event }) => ({
                          decision: event.decision
                        })
                      }
                    },
                    {
                      actions: [
                        {
                          type: 'decideDispute',
                          params: ({ context, event }) => ({
                            ticket: context.ticket,
                            decision: event.decision,
                            refund: event.refund
                          })
                        }
                      ],
                      target: 'waiting4DisputeRefund'
                    }
                  ]
                }
              },
              waiting4DisputeRefund: {
                on: {
                  'REFUND RECEIVED': {
                    actions: [
                      {
                        type: 'receiveRefund',
                        params: ({ context, event }) => ({
                          ticket: context.ticket,
                          transaction: event.transaction
                        })
                      },
                      raise({
                        type: 'TICKET FINALIZED',
                        finalize: finalizeSchema.parse({
                          finalizedBy: ActorType.ARBITRATOR
                        })
                      })
                    ]
                  }
                }
              }
            }
          },
          missedShow: {
            on: {
              'DISPUTE INITIATED': {
                target: 'inDispute',
                actions: [
                  {
                    type: 'initiateDispute',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      dispute: event.dispute,
                      refund: event.refund
                    })
                  },
                  {
                    type: 'sendDisputeInitiated',
                    params: ({ context, event }) => ({
                      ticket: context.ticket,
                      dispute: event.dispute
                    })
                  }
                ]
              }
            }
          }
        }
      }
    },
    on: {
      'SHOW ENDED': {
        target: '#ticketMachine.ended',
        actions: [
          {
            type: 'endShow',
            params: ({ context }) => ({
              ticket: context.ticket
            })
          }
        ]
      }
    }
  });
};

export type TicketMachineServiceType = ReturnType<
  typeof createTicketMachineService
>;

export type TicketMachineStateType = StateFrom<
  ReturnType<typeof createTicketMachine>
>;

export type TicketMachineType = ReturnType<typeof createTicketMachine>;

export { createTicketMachine };

export const createTicketMachineService = ({
  ticket,
  ticketMachineOptions
}: {
  ticket: TicketDocument;
  ticketMachineOptions?: TicketMachineOptions;
}) => {
  const ticketMachine = createTicketMachine({
    ticket,
    ticketMachineOptions
  });
  const ticketService = createActor(ticketMachine).start();
  const saveState = ticketMachineOptions?.saveState || true;

  if (saveState)
    ticketService.subscribe((state) => {
      if (state.context.ticket.save) state.context.ticket.save();
    });

  return ticketService;
};

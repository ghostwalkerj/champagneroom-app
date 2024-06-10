import validator from 'validator';
import z from 'zod';

import {
  ActorType,
  CancelReason,
  CurrencyType,
  DisputeDecision,
  DisputeReason,
  EarningsSource,
  RefundReason
} from '$lib/constants';
import { PayoutStatus } from '$lib/payments';

export type CancelType = z.infer<typeof cancelSchema>;

export type DisputeType = z.infer<typeof ticketDisputeSchema>;

export type EarningsType = z.infer<typeof earningsSchema>;

export type EscrowType = z.infer<typeof escrowSchema>;

export type FeedbackType = z.infer<typeof ticketFeedbackSchema>;

export type FinalizeType = z.infer<typeof finalizeSchema>;

export type MoneyType = z.infer<typeof moneySchema>;

export type PayoutType = z.infer<typeof payoutSchema>;

export type RefundType = z.infer<typeof refundSchema>;

export type SaleType = z.infer<typeof ticketSaleSchema>;

export type TransactionSummaryType = z.infer<typeof transactionSummarySchema>;

export const cancelSchema = z.object({
  cancelledAt: z.coerce.date().default(() => new Date()),
  cancelledInState: z.string().optional(),
  cancelledBy: z.nativeEnum(ActorType),
  reason: z.nativeEnum(CancelReason)
});

export const creatorInfoSchema = z.object({
  name: z.string().trim(),
  profileImageUrl: z.string().trim(),
  averageRating: z.number().min(0).max(5).default(0),
  numberOfReviews: z.number().min(0).default(0)
});

export const creatorSalesStatsSchema = z
  .object({
    totalRevenue: z.record(z.number()).default({}),
    numberOfCompletedShows: z.number().min(0).default(0),
    totalTicketSalesAmounts: z.record(z.number()).default({}),
    totalSales: z.record(z.number()).default({}),
    totalRefunds: z.record(z.number()).default({})
  })
  .strict();

export const disputeStatsSchema = z.object({
  totalDisputes: z.number().min(0).default(0),
  totalDisputesRefunded: z.number().min(0).default(0),
  totalDisputesResolved: z.number().min(0).default(0),
  totalDisputesPending: z.number().min(0).default(0)
});

export const earningsSchema = z.object({
  earnedAt: z.coerce.date().default(() => new Date()),
  amount: z.number().min(0),
  currency: z.nativeEnum(CurrencyType).default(CurrencyType.ETH),
  earningsSource: z
    .nativeEnum(EarningsSource)
    .default(EarningsSource.SHOW_PERFORMANCE),
  earningPercentage: z.number().min(0).max(100).default(100),
  show: z.any()
});

export const escrowSchema = z.object({
  startedAt: z.coerce.date().default(() => new Date()),
  endedAt: z.coerce.date().optional()
});

export const feedbackStatsSchema = z.object({
  numberOfReviews: z.number().min(0).default(0),
  averageRating: z.number().min(0).max(5).default(0),
  comments: z.array(z.string().trim()).default([])
});

const transactionSummarySchema = z.object({
  createdAt: z.coerce.date().default(() => new Date()),
  amount: z.number().min(0),
  currency: z.nativeEnum(CurrencyType),
  rate: z.number().min(0).default(0),
  transaction: z.any().optional()
});

export const finalizeSchema = z.object({
  finalizedAt: z.coerce.date().default(() => new Date())
});

export const moneySchema = z.object({
  amount: z.number().min(0).default(0),
  currency: z.nativeEnum(CurrencyType).default(CurrencyType.USD)
});

export const payoutSchema = z.object({
  payoutAt: z.coerce.date().default(() => new Date()),
  amount: z.number().min(0),
  destination: z
    .string()
    .refine((value) => validator.isEthereumAddress(value), {
      message: 'Invalid Ethereum address'
    }),
  payoutCurrency: z.nativeEnum(CurrencyType).default(CurrencyType.ETH),
  bcPayoutId: z.string().optional(),
  payoutStatus: z.nativeEnum(PayoutStatus).optional(),
  transaction: z.any().optional()
});

export const redemptionSchema = z
  .object({
    redeemedAt: z.coerce.date().default(() => new Date())
  })
  .strict();

export const refundSchema = z.object({
  requestedAt: z.coerce.date().default(() => new Date()),
  requestedAmount: z.number().min(0).default(0),
  approvedAmount: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  payouts: z.array(transactionSummarySchema).default([]),
  reason: z.nativeEnum(RefundReason),
  refundCurrency: z.nativeEnum(CurrencyType).default(CurrencyType.ETH)
});

export const reserveTicketSchema = z.object({
  profileImage: z.string().optional(),
  // 3 char min, 50 char max
  name: z.string().min(3).max(50),
  // 8 digit, number pin
  pin: z
    .array(
      z
        .number({
          invalid_type_error: 'PIN must be numbers'
        })
        .int()
        .nonnegative()
        .lt(10)
    )
    .length(8, 'PIN must be 8 digits')
});

export const runtimeSchema = z.object({
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional()
});

export const showSalesStatsSchema = z.object({
  ticketsAvailable: z.number().min(0).default(0),
  ticketsSold: z.number().min(0).default(0),
  ticketsReserved: z.number().min(0).default(0),
  ticketsRefunded: z.number().min(0).default(0),
  ticketsFinalized: z.number().min(0).default(0),
  ticketsRedeemed: z.number().min(0).default(0),
  ticketSalesAmount: moneySchema.default({
    amount: 0,
    currency: CurrencyType.USD
  }),
  totalSales: z.record(z.number().min(0)).default({}),
  totalRevenue: z.record(z.number().min(0)).default({}),
  totalRefunds: z.record(z.number().min(0)).default({})
});

export const signupSchema = {
  message: z.string(),
  signature: z.string(),
  address: z
    .string()
    .trim()
    .refine((value: string) => validator.isEthereumAddress(value), {
      message: 'Invalid Ethereum address'
    })
};

export const ticketDisputeSchema = z.object({
  startedAt: z.coerce.date().default(() => new Date()),
  endedAt: z.coerce.date().optional(),
  reason: z.nativeEnum(DisputeReason),
  disputedBy: z.nativeEnum(ActorType),
  explanation: z.string().min(10).max(500).optional(),
  decision: z.nativeEnum(DisputeDecision).optional(),
  resolved: z.boolean().default(false),
  ticketId: z.string().trim().optional()
});

export const ticketFeedbackSchema = z.object({
  ticketId: z.string().trim().optional(),
  rating: z.number().min(1).max(5),
  review: z.string().min(0).max(500).optional(),
  createdAt: z.coerce.date().default(() => new Date())
});

export const ticketSaleSchema = z.object({
  soldAt: z.coerce.date().default(() => new Date()),
  payments: z.array(transactionSummarySchema).default([]),
  total: z.number().min(0).default(0),
  paymentCurrency: z.nativeEnum(CurrencyType).default(CurrencyType.ETH)
});

export { transactionSummarySchema };

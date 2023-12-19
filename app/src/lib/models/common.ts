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
import { PayoutStatus } from '$lib/payment';

export type CancelType = z.infer<typeof cancelZodSchema>;

export type DisputeType = z.infer<typeof disputeZodSchema>;

export type EarningsType = z.infer<typeof earningsZodSchema>;

export type EscrowType = z.infer<typeof escrowZodSchema>;

export type FeedbackType = z.infer<typeof feedbackZodSchema>;

export type FinalizeType = z.infer<typeof finalizeZodSchema>;

export type MoneyType = z.infer<typeof moneyZodSchema>;

export type PayoutType = z.infer<typeof payoutZodSchema>;

export type RefundType = z.infer<typeof refundZodSchema>;

export type SaleType = z.infer<typeof saleZodSchema>;

export type TransactionSummaryType = z.infer<
  typeof transactionSummaryZodSchema
>;

export const cancelZodSchema = z.object({
  cancelledAt: z.date().default(() => new Date()),
  cancelledInState: z.string().optional(),
  cancelledBy: z.nativeEnum(ActorType),
  reason: z.nativeEnum(CancelReason)
});

export const creatorInfoZodSchema = z.object({
  name: z.string().trim(),
  profileImageUrl: z.string().trim(),
  averageRating: z.number().min(0).max(5).default(0),
  numberOfReviews: z.number().min(0).default(0)
});

export const disputeStatsZodSchema = z.object({
  totalDisputes: z.number().min(0).default(0),
  totalDisputesRefunded: z.number().min(0).default(0),
  totalDisputesResolved: z.number().min(0).default(0),
  totalDisputesPending: z.number().min(0).default(0)
});

export const disputeZodSchema = z.object({
  _id: z.any().optional(),
  startedAt: z.date().default(() => new Date()),
  endedAt: z.date().optional(),
  reason: z.nativeEnum(DisputeReason),
  disputedBy: z.nativeEnum(ActorType),
  explanation: z.string().min(10).max(500),
  decision: z.nativeEnum(DisputeDecision).optional(),
  resolved: z.boolean().default(false)
});

export const earningsZodSchema = z.object({
  earnedAt: z.date().default(() => new Date()),
  amount: z.number().min(0),
  currency: z.nativeEnum(CurrencyType).default(CurrencyType.ETH),
  earningsSource: z
    .nativeEnum(EarningsSource)
    .default(EarningsSource.SHOW_PERFORMANCE),
  earningPercentage: z.number().min(0).max(100).default(100),
  show: z.any()
});

export const escrowZodSchema = z.object({
  startedAt: z.date().default(() => new Date()),
  endedAt: z.date().optional()
});

export const feedbackStatsZodSchema = z.object({
  numberOfReviews: z.number().min(0).default(0),
  averageRating: z.number().min(0).max(5).default(0),
  comments: z.array(z.string().trim()).default([])
});

export const feedbackZodSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().min(10).max(500).optional(),
  createdAt: z.date().default(() => new Date())
});

export const finalizeZodSchema = z.object({
  finalizedAt: z.date().default(() => new Date()),
  finalizedBy: z.nativeEnum(ActorType)
});

const transactionSummaryZodSchema = z.object({
  createdAt: z.date().default(() => new Date()),
  amount: z.number().min(0),
  currency: z.nativeEnum(CurrencyType),
  rate: z.number().min(0).default(0),
  transaction: z.any().optional()
});

export const moneyZodSchema = z.object({
  amount: z.number().min(0).default(0),
  currency: z.nativeEnum(CurrencyType).default(CurrencyType.USD)
});

export const payoutZodSchema = z.object({
  payoutAt: z.date().default(() => new Date()),
  amount: z.number().min(0),
  destination: z
    .string()
    .refine((value) => validator.isEthereumAddress(value), {
      message: 'Invalid Ethereum address'
    }),
  currency: z.nativeEnum(CurrencyType).default(CurrencyType.ETH),
  bcPayoutId: z.string().optional(),
  payoutStatus: z.nativeEnum(PayoutStatus).optional(),
  transaction: z.any().optional()
});

export const refundZodSchema = z.object({
  requestedAt: z.date().default(() => new Date()),
  requestedAmounts: z.record(z.number()).default({}),
  approvedAmounts: z.record(z.number()).default({}),
  totals: z.record(z.number()).default({}),
  payouts: z.array(transactionSummaryZodSchema),
  reason: z.nativeEnum(RefundReason)
});

export const runtimeZodSchema = z.object({
  startDate: z.date().default(() => new Date()),
  endDate: z.date().optional()
});

export const saleZodSchema = z.object({
  soldAt: z.date().default(() => new Date()),
  payments: z.array(transactionSummaryZodSchema),
  totals: z.record(z.number()).default({})
});

export const salesStatsZodSchema = z
  .object({
    totalRevenue: z.record(z.number()).default({}),
    numberOfCompletedShows: z.number().min(0).default(0),
    totalTicketSalesAmounts: z.record(z.number()).default({}),
    totalSales: z.record(z.number()).default({}),
    totalRefunds: z.record(z.number()).default({})
  })
  .strict();

export const ticketSalesStatsZodSchema = z.object({
  ticketsAvailable: z.number().min(0).default(0),
  ticketsSold: z.number().min(0).default(0),
  ticketsReserved: z.number().min(0).default(0),
  ticketsRefunded: z.number().min(0).default(0),
  ticketsFinalized: z.number().min(0).default(0),
  ticketsRedeemed: z.number().min(0).default(0),
  ticketSalesAmount: moneyZodSchema.default({
    amount: 0,
    currency: CurrencyType.USD
  }),
  totalSales: z.record(z.number().min(0)).default({}),
  totalRevenue: z.record(z.number().min(0)).default({}),
  totalRefunds: z.record(z.number().min(0)).default({})
});

export { transactionSummaryZodSchema };

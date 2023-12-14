import mongoose from 'mongoose';
import { mongooseZodCustomType, z } from 'mongoose-zod';
import validator from 'validator';

import { ActorType, CurrencyType } from '$lib/constants';
import { PayoutStatus } from '$lib/payment';

import { transactionSummaryZodSchema } from './transaction';

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

export enum CancelReason {
  CREATOR_NO_SHOW = 'CREATOR NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
  CREATOR_CANCELLED = 'CREATOR CANCELLED',
  TICKET_PAYMENT_TIMEOUT = 'TICKET PAYMENT TIMEOUT',
  TICKET_PAYMENT_FAILED = 'TICKET PAYMENT FAILED',
  TICKET_PAYMENT_INVALID = 'TICKET PAYMENT INVALID'
}

export enum DisputeDecision {
  NO_REFUND = 'NO REFUND',
  FULL_REFUND = 'FULL REFUND',
  PARTIAL_REFUND = 'PARTIAL REFUND'
}

export enum DisputeReason {
  ATTEMPTED_SCAM = 'ATTEMPTED SCAM',
  ENDED_EARLY = 'ENDED EARLY',
  LOW_QUALITY = 'LOW QUALITY',
  CREATOR_NO_SHOW = 'CREATOR NO SHOW',
  SHOW_NEVER_STARTED = 'SHOW NEVER STARTED'
}

export enum EarningsSource {
  SHOW_PERFORMANCE = 'SHOW PERFORMANCE',
  COMMISSION = 'COMMISSION',
  REFERRAL = 'REFERRAL'
}

export enum RefundReason {
  SHOW_CANCELLED = 'SHOW CANCELLED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
  DISPUTE_DECISION = 'DISPUTE DECISION',
  UNKNOWN = 'UNKNOWN'
}

export const cancelZodSchema = z.object({
  _id: mongooseZodCustomType('ObjectId')
    .default(() => new mongoose.Types.ObjectId())
    .mongooseTypeOptions({ _id: true, index: true, unique: true })
    .optional(),
  cancelledAt: z.date().default(() => new Date()),
  cancelledInState: z.string().optional(),
  cancelledBy: z.nativeEnum(ActorType),
  reason: z.nativeEnum(CancelReason)
});

export const disputeZodSchema = z.object({
  _id: mongooseZodCustomType('ObjectId')
    .default(() => new mongoose.Types.ObjectId())
    .mongooseTypeOptions({ _id: true, index: true, unique: true })
    .optional(),
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
  show: mongooseZodCustomType('ObjectId').mongooseTypeOptions({ ref: 'Show' })
});

export const escrowZodSchema = z.object({
  _id: mongooseZodCustomType('ObjectId')
    .default(() => new mongoose.Types.ObjectId())
    .mongooseTypeOptions({ _id: true, index: true, unique: true })
    .optional(),
  startedAt: z.date().default(() => new Date()),
  endedAt: z.date().optional()
});

export const feedbackZodSchema = z.object({
  _id: mongooseZodCustomType('ObjectId')
    .default(() => new mongoose.Types.ObjectId())
    .mongooseTypeOptions({ _id: true, index: true, unique: true })
    .optional(),
  rating: z.number().min(1).max(5),
  review: z.string().min(10).max(500).optional(),
  createdAt: z.date().default(() => new Date())
});

export const finalizeZodSchema = z.object({
  _id: mongooseZodCustomType('ObjectId')
    .default(() => new mongoose.Types.ObjectId())
    .mongooseTypeOptions({ _id: true, index: true, unique: true })
    .optional(),
  finalizedAt: z.date().default(() => new Date()),
  finalizedBy: z.nativeEnum(ActorType)
});

export const moneyZodSchema = z.object({
  amount: z.number().min(0),
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
  transaction: mongooseZodCustomType('ObjectId')
    .optional()
    .mongooseTypeOptions({ ref: 'Transaction' })
});

export const refundZodSchema = z.object({
  _id: mongooseZodCustomType('ObjectId')
    .default(() => new mongoose.Types.ObjectId())
    .mongooseTypeOptions({ _id: true, index: true, unique: true })
    .optional(),
  requestedAt: z.date().default(() => new Date()),
  requestedAmounts: z.map(z.string(), z.number()).default(() => new Map()),
  approvedAmounts: z.map(z.string(), z.number()).default(() => new Map()),
  totals: z.map(z.string(), z.number()).default(() => new Map()),
  payouts: z.array(transactionSummaryZodSchema),
  reason: z.nativeEnum(RefundReason)
});

export const saleZodSchema = z.object({
  _id: mongooseZodCustomType('ObjectId')
    .default(() => new mongoose.Types.ObjectId())
    .mongooseTypeOptions({ _id: true, index: true, unique: true })
    .optional(),
  soldAt: z.date().default(() => new Date()),
  payments: z.array(transactionSummaryZodSchema),
  totals: z.map(z.string(), z.number()).default(() => new Map())
});

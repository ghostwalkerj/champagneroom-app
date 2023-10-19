import { type InferSchemaType, Schema } from 'mongoose';
import validator from 'validator';

import { ActorType } from '$lib/constants';
import { PayoutStatus } from '$lib/util/payment';

import { transactionSummary } from './transaction';

export type CancelType = InferSchemaType<typeof cancelSchema>;

export type DisputeType = InferSchemaType<typeof disputeSchema>;

export type EarningsType = InferSchemaType<typeof earningsSchema>;

export type EscrowType = InferSchemaType<typeof escrowSchema>;

export type FeedbackType = InferSchemaType<typeof feedbackSchema>;

export type FinalizeType = InferSchemaType<typeof finalizeSchema>;

export type MoneyType = InferSchemaType<typeof moneySchema>;

export type PayoutType = InferSchemaType<typeof payoutSchema>;

export type RefundType = InferSchemaType<typeof refundSchema>;

export type SaleType = InferSchemaType<typeof saleSchema>;

export type UserType = InferSchemaType<typeof userSchema>;

export enum AuthType {
  SIGNING = 'SIGNING',
  UNIQUE_KEY = 'UNIQUE KEY',
  PASSWORD = 'PASSWORD',
  NONE = 'NONE'
}

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

export enum CurrencyType {
  USD = 'USD',
  ETH = 'ETH'
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

export enum RefundReason {
  SHOW_CANCELLED = 'SHOW CANCELLED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
  DISPUTE_DECISION = 'DISPUTE DECISION',
  UNKNOWN = 'UNKNOWN'
}

export const cancelSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  cancelledAt: { type: Date, default: new Date() },
  cancelledInState: { type: String },
  cancelledBy: { type: String, enum: ActorType, required: true },
  reason: { type: String, enum: CancelReason, required: true }
});

export const disputeSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  startedAt: { type: Date, default: new Date() },
  endedAt: { type: Date },
  reason: { type: String, enum: DisputeReason, required: true },
  disputedBy: { type: String, enum: ActorType, required: true },
  explanation: { type: String, required: true },
  decision: { type: String, enum: DisputeDecision },
  resolved: { type: Boolean, default: false }
});
export const earningsSchema = new Schema({
  earnedAt: { type: Date, default: new Date() },
  amount: { type: Number, required: true },
  currency: {
    type: String,
    enum: CurrencyType,
    required: true,
    default: CurrencyType.ETH
  },
  show: {
    type: Schema.Types.ObjectId,
    ref: 'Show',
    index: true,
    required: true
  }
});
export const escrowSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  startedAt: { type: Date, default: new Date() },
  endedAt: { type: Date }
});
export const feedbackSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  review: { type: String },
  createdAt: { type: Date, default: new Date() }
});

export const finalizeSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  finalizedAt: { type: Date, default: new Date() },
  finalizedBy: { type: String, enum: ActorType, required: true }
});
export const moneySchema = new Schema({
  amount: { type: Number, required: true },
  currency: {
    type: String,
    enum: CurrencyType,
    required: true,
    default: CurrencyType.USD
  }
});
export const payoutSchema = new Schema({
  payoutAt: { type: Date, default: new Date() },
  amount: { type: Number, required: true },
  destination: { type: String, required: true },
  currency: {
    type: String,
    enum: CurrencyType,
    required: true,
    default: CurrencyType.ETH
  },
  payoutId: { type: String },
  payoutStatus: { type: String, enum: PayoutStatus },
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' }
});

export const refundSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  requestedAt: { type: Date, default: new Date() },
  requestedAmounts: {
    type: Map,
    required: true,
    of: Number,
    default: () => new Map<string, number>()
  },
  approvedAmounts: {
    type: Map,
    required: true,
    of: Number,
    default: () => new Map<string, number>()
  },
  totals: {
    type: Map,
    required: true,
    of: Number,
    default: () => new Map<string, number>()
  },
  payouts: {
    type: Map,
    of: [transactionSummary],
    default: () => [],
    required: true
  },
  reason: { type: String, enum: RefundReason, required: true }
});

export const saleSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  soldAt: { type: Date, default: new Date() },
  payments: {
    type: Map,
    of: [transactionSummary],
    default: () => [],
    required: true
  },
  totals: {
    type: Map,
    of: Number,
    required: true,
    default: () => new Map<string, number>()
  }
});
export const userSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },

    address: {
      type: String,
      maxLength: 50,
      lowerCase: true
    },

    payoutAddress: {
      type: String,
      maxLength: 50,
      validator: (v: string) => validator.isEthereumAddress(v),
      lowerCase: true
    },

    nonce: {
      type: Number,
      default: () => Math.floor(Math.random() * 1_000_000)
    },

    name: {
      type: String,
      maxLength: 50,
      minLength: [3, 'Name is too short'],
      required: true,
      trim: true
    },

    authType: {
      type: String,
      enum: AuthType,
      required: true,
      default: AuthType.SIGNING
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

import { type InferSchemaType, Schema } from 'mongoose';
import validator from 'validator';

import { ActorType } from '$lib/constants';

export enum CancelReason {
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
  TALENT_CANCELLED = 'TALENT CANCELLED',
  TICKET_PAYMENT_TIMEOUT = 'TICKET PAYMENT TIMEOUT'
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
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  SHOW_NEVER_STARTED = 'SHOW NEVER STARTED'
}

export enum RefundReason {
  SHOW_CANCELLED = 'SHOW CANCELLED',
  TICKET_CANCELLED = 'TICKET CANCELLED',
  DISPUTE_DECISION = 'DISPUTE DECISION'
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

export const refundSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  refundedAt: { type: Date, default: new Date() },
  transactions: [
    { type: Schema.Types.ObjectId, ref: 'Transaction', required: true }
  ],
  amount: { type: Number, required: true, default: 0 },
  reason: { type: String, enum: RefundReason, required: true }
});

export const saleSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, auto: true },
  soldAt: { type: Date, default: new Date() },
  transactions: [
    { type: Schema.Types.ObjectId, ref: 'Transaction', required: true }
  ],
  amount: { type: Number, required: true, default: 0 }
});

export const userSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },

    walletAddress: {
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

    auth: {
      type: Boolean,
      default: true,
      index: true
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    },

    address: {
      type: String,
      required: true,
      maxLength: 50,
      minLength: 30,
      unique: true,
      index: true
    }
  },
  { timestamps: true }
);

export type CancelType = InferSchemaType<typeof cancelSchema>;
export type DisputeType = InferSchemaType<typeof disputeSchema>;
export type EscrowType = InferSchemaType<typeof escrowSchema>;
export type FeedbackType = InferSchemaType<typeof feedbackSchema>;
export type FinalizeType = InferSchemaType<typeof finalizeSchema>;
export type RefundType = InferSchemaType<typeof refundSchema>;
export type SaleType = InferSchemaType<typeof saleSchema>;

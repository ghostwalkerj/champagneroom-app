import { type InferSchemaType, Schema } from 'mongoose';

import { ActorType } from '$lib/constants';

export enum CancelReason {
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
  TALENT_CANCELLED = 'TALENT CANCELLED',
}

export enum DisputeDecision {
  TALENT_WON = 'TALENT WON',
  CUSTOMER_WON = 'CUSTOMER WON',
  SPLIT = 'SPLIT',
}

export enum DisputeReason {
  ATTEMPTED_SCAM = 'ATTEMPTED SCAM',
  ENDED_EARLY = 'ENDED EARLY',
  LOW_QUALITY = 'LOW QUALITY',
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  SHOW_NEVER_STARTED = 'SHOW NEVER STARTED',
}

export const cancelSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, required: true, auto: true },
  cancelledAt: { type: Date, required: true, default: Date.now },
  cancelledInState: { type: String },
  cancelledBy: { type: String, enum: ActorType, required: true },
  reason: { type: String, enum: CancelReason, required: true },
});

export const disputeSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, required: true, index: true },
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date },
  reason: { type: String, enum: DisputeReason, required: true },
  disputedBy: { type: String, enum: ActorType, required: true },
  explanation: { type: String, required: true },
  decision: { type: String, enum: DisputeDecision },
});

export const escrowSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, required: true, index: true },
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date },
});

export const feedbackSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, required: true, index: true },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  },
  review: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
});

export const finalizeSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, required: true, index: true },
  finalizedAt: { type: Date, required: true, default: Date.now },
  finalizedBy: { type: String, enum: ActorType, required: true },
});

export const refundSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, required: true, index: true },
  refundedAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  ],
  requestedBy: { type: String, enum: ActorType, required: true },
  amount: { type: Number, required: true, default: 0 },
});

export const saleSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _id: { type: Schema.Types.ObjectId, required: true, index: true },
  soldAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  ],
  amount: { type: Number, required: true, default: 0 },
});

export type CancelType = InferSchemaType<typeof cancelSchema>;
export type DisputeType = InferSchemaType<typeof disputeSchema>;
export type EscrowType = InferSchemaType<typeof escrowSchema>;
export type FeedbackType = InferSchemaType<typeof feedbackSchema>;
export type FinalizeType = InferSchemaType<typeof finalizeSchema>;
export type RefundType = InferSchemaType<typeof refundSchema>;
export type SaleType = InferSchemaType<typeof saleSchema>;

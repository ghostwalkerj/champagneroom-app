import { type InferSchemaType, Schema } from 'mongoose';

import { ActorType } from '$lib/constants';

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

export enum CancelReason {
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
  TALENT_CANCELLED = 'TALENT CANCELLED',
}

export const cancelSchema = new Schema({
  cancelledAt: { type: Date, required: true, default: Date.now },
  cancelledInState: { type: String },
  cancelledBy: { type: String, enum: ActorType, required: true },
  reason: { type: String, enum: CancelReason, required: true },
});

export const finalizeSchema = new Schema({
  finalizedAt: { type: Date, required: true, default: Date.now },
  finalizedBy: { type: String, enum: ActorType, required: true },
});

export const escrowSchema = new Schema({
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date },
});

export const refundSchema = new Schema({
  refundedAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  ],
  requestedBy: { type: String, enum: ActorType, required: true },
  amount: { type: Number, required: true, default: 0 },
});

export const disputeSchema = new Schema({
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date },
  reason: { type: String, enum: DisputeReason, required: true },
  disputedBy: { type: String, enum: ActorType, required: true },
  explanation: { type: String, required: true },
  decision: { type: String, enum: DisputeDecision },
});

export const saleSchema = new Schema({
  soldAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  ],
  amount: { type: Number, required: true, default: 0 },
});

export type FinalizeType = InferSchemaType<typeof finalizeSchema>;

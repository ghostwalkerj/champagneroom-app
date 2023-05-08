import { ActorType } from '$lib/util/constants';
import type { InferSchemaType } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export enum ShowStatus {
  CREATED = 'CREATED',
  BOX_OFFICE_OPEN = 'BOX OFFICE OPEN',
  BOX_OFFICE_CLOSED = 'BOX OFFICE CLOSED',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  CANCELLATION_REQUESTED = 'CANCELLATION REQUESTED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  STOPPED = 'STOPPED',
  IN_ESCROW = 'IN ESCROW',
}

export enum ShowCancelReason {
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  TALENT_CANCELLED = 'TALENT CANCELLED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
}

const cancelSchema = new Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  cancelledInState: { type: String, enum: ShowStatus },
  canceller: { type: String, enum: ActorType, required: true },
  reason: { type: String, enum: ShowCancelReason, required: true },
});

const finalizeSchema = new Schema({
  finalizedAt: { type: Date, required: true, default: Date.now },
  finalizer: { type: String, enum: ActorType, required: true },
});

const escrowSchema = new Schema({
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date },
});

const showStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: ShowStatus,
      required: true,
      default: ShowStatus.CREATED,
    },
    active: { type: Boolean, required: true, default: true },
    ticketStats: {
      available: { type: Number, required: true, default: 0 },
      sold: { type: Number, required: true, default: 0 },
      reserved: { type: Number, required: true, default: 0 },
      refunded: { type: Number, required: true, default: 0 },
      redeemed: { type: Number, required: true, default: 0 },
    },
    totalSales: { type: Number, required: true, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    refundedAmount: { type: Number, required: true, default: 0 },
    cancel: {
      type: cancelSchema,
    },
    finalize: { type: finalizeSchema },
    escrow: {
      type: escrowSchema,
    },
  },
  { timestamps: true }
);

const showSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    roomId: { type: String, required: true },
    coverImageUrl: { type: String, trim: true },
    duration: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    maxNumTickets: { type: Number, required: true },
    price: { type: Number, required: true },
    showState: { type: showStateSchema, required: true },
  },
  { timestamps: true }
);

export type ShowDocType = InferSchemaType<typeof showSchema>;

export const Show = mongoose.model<ShowDocType>('Show', showSchema);

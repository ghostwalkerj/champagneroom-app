import { ActorType } from '$lib/util/constants';
import type { InferSchemaType, Model } from 'mongoose';
import { models } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { MONGO_FIELD_SECRET } from '$env/static/private';
import { fieldEncryption } from 'mongoose-field-encryption';

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
  startDate: { type: Date, required: true },
  endDate: { type: Date },
});

const engagementSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date },
});

const salesStatsSchema = new Schema({
  ticketsAvailable: { type: Number, required: true, default: 0 },
  ticketsSold: { type: Number, required: true, default: 0 },
  ticketsReserved: { type: Number, required: true, default: 0 },
  ticketsRefunded: { type: Number, required: true, default: 0 },
  ticketsRedeemed: { type: Number, required: true, default: 0 },
  totalSales: { type: Number, required: true, default: 0 },
  totalRefunded: { type: Number, required: true, default: 0 },
});

const showStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: ShowStatus,
      required: true,
      default: ShowStatus.CREATED,
    },
    salesStats: {
      type: salesStatsSchema,
      required: true,
      default: () => ({}),
    },
    cancel: {
      type: cancelSchema,
    },
    finalize: { type: finalizeSchema },
    escrow: {
      type: escrowSchema,
    },
    runtime: {
      type: engagementSchema,
    },
  },
  { timestamps: true }
);

const showSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    roomId: {
      type: String,
      required: true,
      default: function () {
        return uuidv4();
      },
    },
    coverImageUrl: { type: String, trim: true },
    duration: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    numTickets: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 1 },
    showState: { type: showStateSchema, required: true },
  },
  { timestamps: true }
);

showSchema.plugin(fieldEncryption, {
  fields: ['roomId'],
  secret: MONGO_FIELD_SECRET,
});

export type ShowDocType = InferSchemaType<typeof showSchema>;

export const Show = (
  models.Show ? models.Show : mongoose.model<ShowDocType>('Show', showSchema)
) as Model<ShowDocType>;

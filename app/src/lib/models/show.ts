import { MONGO_FIELD_SECRET } from '$env/static/private';
import { ShowEventModel } from '$lib/models/showEvent';
import { ActorType } from '$lib/util/constants';
import type { InferSchemaType, Model } from 'mongoose';
import mongoose, { Schema, models } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import { v4 as uuidv4 } from 'uuid';
import type { TicketDocType } from './ticket';
import type { TransactionDocType } from './transaction';

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
  cancelledAt: { type: Date, required: true, default: Date.now },
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

const runtimeSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date },
});

const salesStatsSchema = new Schema({
  ticketsAvailable: { type: Number, required: true, default: 0, integer: true },
  ticketsSold: { type: Number, required: true, default: 0, integer: true },
  ticketsReserved: { type: Number, required: true, default: 0, integer: true },
  ticketsRefunded: { type: Number, required: true, default: 0, integer: true },
  ticketsRedeemed: { type: Number, required: true, default: 0, integer: true },
  totalSales: { type: Number, required: true, default: 0, integer: true },
  totalRefunded: { type: Number, required: true, default: 0, integer: true },
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
      type: runtimeSchema,
    },
    transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
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
      unique: true,
    },
    coverImageUrl: { type: String, trim: true },
    duration: {
      type: Number,
      required: true,
      min: [0, 'Duration must be over 0'],
      max: [180, 'Duration must be under 180 minutes'],
      integer: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: [3, 'Name must be at least 3 characters'],
      maxLength: [50, 'Name must be under 50 characters'],
      startcase: true,
    },
    numTickets: { type: Number, required: true, min: 1, integer: true },
    price: { type: Number, required: true, min: 1 },
    showState: { type: showStateSchema, required: true, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

showSchema.plugin(fieldEncryption, {
  fields: ['roomId'],
  secret: MONGO_FIELD_SECRET,
});

showSchema.methods.createShowevent = async function ({
  type,
  ticket,
  transaction,
}: {
  type: string;
  ticket?: TicketDocType;
  transaction?: TransactionDocType;
}): Promise<void> {
  const showevent = new ShowEventModel({
    type,
    show: this._id,
    talent: this.talent,
    agent: this.agent,
    ticket,
    transaction,
  });
  showevent.save();
};

export type ShowStateType = InferSchemaType<typeof showStateSchema>;

export type ShowDocType = InferSchemaType<typeof showSchema>;

export const ShowModel = (
  models.Show ? models.Show : mongoose.model<ShowDocType>('Show', showSchema)
) as Model<ShowDocType>;

export type ShowType = InstanceType<typeof ShowModel>;

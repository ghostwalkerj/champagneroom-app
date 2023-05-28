import { ActorType } from '$lib/util/constants';
import { MONGO_DB_FIELD_SECRET } from '$lib/util/secrets';
import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import validator from 'validator';

const { Schema, models } = pkg;
export enum TicketStatus {
  RESERVED = 'RESERVED',
  CANCELLATION_INITIATED = 'CANCELLATION INITIATED',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  REDEEMED = 'REDEEMED',
  IN_ESCROW = 'IN ESCROW',
  IN_DISPUTE = 'IN DISPUTE',
  REFUNDED = 'REFUNDED',
  MISSED_SHOW = 'MISSED SHOW',
  SHOW_CANCELLED = 'SHOW CANCELLED',
}

export enum TicketCancelReason {
  SHOW_CANCELLED = 'SHOW CANCELLED',
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
}

export enum TicketDisputeDecision {
  TALENT_WON = 'TALENT WON',
  CUSTOMER_WON = 'CUSTOMER WON',
  SPLIT = 'SPLIT',
}

export enum TicketDisputeReason {
  ATTEMPTED_SCAM = 'ATTEMPTED SCAM',
  ENDED_EARLY = 'ENDED EARLY',
  LOW_QUALITY = 'LOW QUALITY',
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  SHOW_NEVER_STARTED = 'SHOW NEVER STARTED',
}

const cancelSchema = new Schema({
  cancelledAt: { type: Date, required: true, default: Date.now },
  cancelledBy: { type: String, enum: ActorType, required: true },
  reason: { type: String, enum: TicketCancelReason, required: true },
  cancelledInState: { type: String, enum: TicketStatus },
});

const redemptionSchema = new Schema({
  redeemedAt: { type: Date, required: true, default: Date.now },
});

const reservationSchema = new Schema({
  reservedAt: { type: Date, required: true, default: Date.now },
  name: { type: String, required: true },
  pin: {
    type: String,
    required: true,
    minLength: 8,
    maxLength: 8,
    validator: (v: string) => validator.isNumeric(v, { no_symbols: true }),
  },
});

reservationSchema.plugin(fieldEncryption, {
  fields: ['pin'],
  secret: MONGO_DB_FIELD_SECRET,
});

const escrowSchema = new Schema({
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date },
});

const disputeSchema = new Schema({
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date },
  reason: { type: String, enum: TicketDisputeReason, required: true },
  disputedBy: { type: String, enum: ActorType, required: true },
  explanation: { type: String, required: true },
  decision: { type: String, enum: TicketDisputeDecision },
});

const finalizeSchema = new Schema({
  finalizedAt: { type: Date, required: true, default: Date.now },
  finalizer: { type: String, enum: ActorType, required: true },
});

const feedbackSchema = new Schema({
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

const refundSchema = new Schema({
  refundedAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  ],
  amount: { type: Number, required: true, default: 0 },
});

const saleSchema = new Schema({
  soldAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  ],
  amount: { type: Number, required: true, default: 0 },
});

const ticketStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: TicketStatus,
      required: true,
      default: TicketStatus.RESERVED,
    },
    active: { type: Boolean, required: true, default: true },

    totalPaid: { type: Number, required: true, default: 0 },
    totalRefunded: { type: Number, required: true, default: 0 },
    cancel: cancelSchema,
    redemption: redemptionSchema,
    reservation: reservationSchema,
    escrow: escrowSchema,
    dispute: disputeSchema,
    finalize: finalizeSchema,
    feedback: feedbackSchema,
    refund: refundSchema,
    sale: saleSchema,
  },
  { timestamps: true }
);

export const ticketSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    paymentAddress: {
      type: String,
      maxLength: 50,
      required: true,
      validator: (v: string) => validator.isEthereumAddress(v),
    },
    price: { type: Number, required: true },
    show: { type: Schema.Types.ObjectId, ref: 'Show' },
    ticketState: {
      type: ticketStateSchema,
      required: true,
      default: () => ({}),
    },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent', required: true },
    transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  },
  { timestamps: true }
);

export type TicketStateType = InferSchemaType<typeof ticketStateSchema>;
export type TicketDocType = InferSchemaType<typeof ticketSchema>;

export const Ticket = models?.Ticket
  ? (models.Ticket as Model<TicketDocType>)
  : mongoose.model<TicketDocType>('Ticket', ticketSchema);

export type TicketType = InstanceType<typeof Ticket>;

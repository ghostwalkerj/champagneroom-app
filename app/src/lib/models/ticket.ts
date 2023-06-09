import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import validator from 'validator';

import {
  cancelSchema,
  disputeSchema,
  escrowSchema,
  feedbackSchema,
  finalizeSchema,
  refundSchema,
  saleSchema,
} from './common';

enum TicketStatus {
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

const { Schema, models } = pkg;
export const SaveState = (ticket: TicketType, newState: TicketStateType) => {
  Ticket.updateOne(
    { _id: ticket._id },
    { $set: { showState: newState } }
  ).exec();
};

const redemptionSchema = new Schema({
  redeemedAt: { type: Date, required: true, default: Date.now },
});

const ticketStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: TicketStatus,
      required: true,
      default: TicketStatus.RESERVED,
    },
    activeState: { type: Boolean, required: true, default: true, index: true },
    totalPaid: { type: Number, required: true, default: 0 },
    totalRefunded: { type: Number, required: true, default: 0 },
    cancel: cancelSchema,
    redemption: redemptionSchema,
    escrow: escrowSchema,
    dispute: disputeSchema,
    finalize: finalizeSchema,
    feedback: feedbackSchema,
    refund: refundSchema,
    sale: saleSchema,
  },
  { timestamps: true }
);

const ticketSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    paymentAddress: {
      type: String,
      maxLength: 50,
      required: true,
      validator: (v: string) => validator.isEthereumAddress(v),
    },
    price: { type: Number, required: true },
    show: { type: Schema.Types.ObjectId, ref: 'Show', index: true },
    ticketState: {
      type: ticketStateSchema,
      required: true,
      default: () => ({}),
    },
    customerName: { type: String, required: true },
    pin: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 8,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      validator: (v: string) => validator.isNumeric(v, { no_symbols: true }),
    },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent', required: true },
  },
  { timestamps: true }
);

ticketSchema.plugin(fieldEncryption, {
  fields: ['pin'],
  secret: process.env.MONGO_DB_FIELD_SECRET,
});

export const Ticket = models?.Ticket
  ? (models.Ticket as Model<TicketDocumentType>)
  : mongoose.model<TicketDocumentType>('Ticket', ticketSchema);

export { TicketStatus };

export type TicketDocumentType = InferSchemaType<typeof ticketSchema>;

export type TicketStateType = InferSchemaType<typeof ticketStateSchema>;

export type TicketType = InstanceType<typeof Ticket>;

import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { fieldEncryption } from 'mongoose-field-encryption';
import validator from 'validator';

import {
  cancelSchema,
  disputeSchema,
  escrowSchema,
  feedbackSchema,
  finalizeSchema,
  moneySchema,
  refundSchema,
  saleSchema
} from './common';
import type { ShowDocumentType } from './show';

enum TicketStatus {
  RESERVED = 'RESERVED',
  REFUND_REQUESTED = 'REFUND REQUESTED',
  PAYMENT_INITIATED = 'PAYMENT INITIATED',
  PAYMENT_RECEIVED = 'PAYMENT RECEIVED',
  WAITING_FOR_REFUND = 'WAITING FOR REFUND',
  FULLY_PAID = 'FULLY PAID',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  REDEEMED = 'REDEEMED',
  IN_ESCROW = 'IN ESCROW',
  IN_DISPUTE = 'IN DISPUTE',
  REFUNDED = 'REFUNDED',
  MISSED_SHOW = 'MISSED SHOW',
  SHOW_CANCELLED = 'SHOW CANCELLED',
  WAITING_FOR_DISPUTE_REFUND = 'WAITING FOR DISPUTE REFUND'
}

const { Schema, models } = pkg;
export type TicketDocument = InstanceType<typeof Ticket>;

const redemptionSchema = new Schema({
  redeemedAt: { type: Date, default: Date.now }
});

const ticketStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: TicketStatus,
      default: TicketStatus.RESERVED,
      index: true
    },
    active: { type: Boolean, default: true, index: true },

    cancel: cancelSchema,
    redemption: redemptionSchema,
    escrow: escrowSchema,
    dispute: disputeSchema,
    finalize: finalizeSchema,
    feedback: feedbackSchema,
    refund: refundSchema,
    sale: saleSchema
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
      validator: (v: string) => validator.isEthereumAddress(v)
    },
    price: {
      type: moneySchema,
      required: true
    },
    show: {
      type: Schema.Types.ObjectId,
      ref: 'Show',
      index: true,
      required: true
    },
    bcInvoiceId: { type: String, index: true },
    ticketState: {
      type: ticketStateSchema,
      required: true,
      default: () => ({})
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      autopopulate: true
    },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    creator: { type: Schema.Types.ObjectId, ref: 'Creator', required: true }
  },
  { timestamps: true }
);

ticketSchema.plugin(fieldEncryption, {
  fields: ['pin'],
  secret: process.env.MONGO_DB_FIELD_SECRET
});

ticketSchema.plugin(mongooseAutoPopulate);

export type TicketDocumentType = InferSchemaType<typeof ticketSchema> & {
  show: ShowDocumentType;
};

export type TicketStateType = InferSchemaType<typeof ticketStateSchema>;

export const SaveState = (
  ticket: TicketDocument,
  newState: TicketStateType
) => {
  Ticket.updateOne(
    { _id: ticket._id },
    { $set: { showState: newState } }
  ).exec();
};

export const Ticket = models?.Ticket
  ? (models.Ticket as Model<TicketDocumentType>)
  : mongoose.model<TicketDocumentType>('Ticket', ticketSchema);

export { TicketStatus };

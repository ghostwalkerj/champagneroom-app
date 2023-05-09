import type { InferSchemaType, Model } from 'mongoose';
import { models } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export enum TransactionReasonType {
  TICKET_PAYMENT = 'TICKET PAYMENT',
  TICKET_REFUND = 'TICKET REFUND',
  DISPUTE_RESOLUTION = 'DISPUTE RESOLUTION',
}

const transactionSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    hash: { type: String },
    block: { type: Number },
    from: { type: String },
    to: { type: String },
    reason: { type: String, enum: TransactionReasonType },
    value: { type: String },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent' },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    show: { type: Schema.Types.ObjectId, ref: 'Show' },
  },
  { timestamps: true }
);

export type TransactionDocType = InferSchemaType<typeof transactionSchema>;
export const Transaction = models.Transaction
  ? (models.Transaction as Model<TransactionDocType>)
  : (mongoose.model<TransactionDocType>(
      'Transaction',
      transactionSchema
    ) as Model<TransactionDocType>);

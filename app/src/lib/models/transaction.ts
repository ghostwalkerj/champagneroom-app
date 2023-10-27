import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import validator from 'validator';

import { CurrencyType } from './common';

enum TransactionReasonType {
  TICKET_PAYMENT = 'TICKET PAYMENT',
  TICKET_REFUND = 'TICKET REFUND',
  DISPUTE_RESOLUTION = 'DISPUTE RESOLUTION',
  CREATOR_PAYOUT = 'CREATOR PAYOUT'
}

const { Schema, models } = pkg;

const transactionSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    hash: { type: String },
    from: { type: String },
    to: { type: String },
    confirmations: { type: Number },
    reason: { type: String, enum: TransactionReasonType },
    amount: {
      type: String,
      required: true,
      validator: (v: string) => validator.isNumeric(v)
    },
    rate: {
      type: String,
      validator: (v: string) => validator.isNumeric(v)
    },
    currency: {
      type: String,
      enum: CurrencyType,
      required: true
    },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    creator: { type: Schema.Types.ObjectId, ref: 'Creator' },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    show: { type: Schema.Types.ObjectId, ref: 'Show' },
    bcPayoutId: { type: String }
  },
  { timestamps: true }
);

export type TransactionDocument = InstanceType<typeof Transaction>;

export type TransactionDocumentType = InferSchemaType<typeof transactionSchema>;

export type TransactionSummaryType = InferSchemaType<typeof transactionSummary>;

export const Transaction = models?.Transaction
  ? (models?.Transaction as Model<TransactionDocumentType>)
  : mongoose.model<TransactionDocumentType>('Transaction', transactionSchema);
export { TransactionReasonType };
export const transactionSummary = new Schema({
  createdAt: { type: Date, default: new Date() },
  amount: { type: Number, required: true },
  currency: {
    type: String,
    enum: CurrencyType,
    required: true
  },
  rate: { type: Number, default: 0 },
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' }
});

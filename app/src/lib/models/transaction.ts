import type { InferSchemaType, Model } from 'mongoose';
import mongoose, { Schema, models } from 'mongoose';
import validator from 'validator';

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
    value: {
      type: String,
      required: true,
      validator: (v: string) => validator.isNumeric(v),
    },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent' },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    show: { type: Schema.Types.ObjectId, ref: 'Show' },
  },
  { timestamps: true }
);

export type TransactionDocType = InferSchemaType<typeof transactionSchema>;
export const TransactionModel = models.Transaction
  ? (models.Transaction as Model<TransactionDocType>)
  : (mongoose.model<TransactionDocType>(
      'Transaction',
      transactionSchema
    ) as Model<TransactionDocType>);

export type TransactionType = InstanceType<typeof TransactionModel>;

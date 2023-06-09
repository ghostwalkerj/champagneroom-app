import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import validator from 'validator';

enum TransactionReasonType {
  TICKET_PAYMENT = 'TICKET PAYMENT',
  TICKET_REFUND = 'TICKET REFUND',
  DISPUTE_RESOLUTION = 'DISPUTE RESOLUTION',
}

const { Schema, models } = pkg;

const transactionSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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

export const Transaction = models?.Transaction
  ? (models?.Transaction as Model<TransactionDocumentType>)
  : mongoose.model<TransactionDocumentType>('Transaction', transactionSchema);
export { TransactionReasonType };

export type TransactionDocumentType = InferSchemaType<typeof transactionSchema>;
export type TransactionType = InstanceType<typeof Transaction>;

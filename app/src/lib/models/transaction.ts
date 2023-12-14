import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';
import validator from 'validator';

import { CurrencyType } from '$lib/constants';

enum TransactionReasonType {
  TICKET_PAYMENT = 'TICKET PAYMENT',
  TICKET_REFUND = 'TICKET REFUND',
  DISPUTE_RESOLUTION = 'DISPUTE RESOLUTION',
  CREATOR_PAYOUT = 'CREATOR PAYOUT'
}

export type TransactionDocument = InstanceType<typeof Transaction>;

export type TransactionDocumentType = z.infer<typeof transactionZodSchema>;

export type TransactionSummaryType = z.infer<
  typeof transactionSummaryZodSchema
>;

const { models } = pkg;

const transactionZodSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId')
      .default(() => new mongoose.Types.ObjectId())
      .mongooseTypeOptions({ _id: true })
      .optional(),
    hash: z.string().trim().optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    confirmations: z.number().positive().optional(),
    reason: z.nativeEnum(TransactionReasonType).optional(),
    amount: z.string().refine((value) => validator.isNumeric(value), {
      message: 'Amount must be numeric'
    }),
    rate: z
      .string()
      .optional()
      .refine((value = '') => validator.isNumeric(value), {
        message: 'Rate must be numeric'
      }),
    currency: z.nativeEnum(CurrencyType),
    ticket: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
      ref: 'Ticket'
    }),
    creator: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
      ref: 'Creator'
    }),
    agent: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
      ref: 'Agent'
    }),
    show: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
      ref: 'Show'
    }),
    bcPayoutId: z.string().trim().optional()
  })
  .merge(genTimestampsSchema('createdAt', 'updatedAt'))
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'transactions'
    }
  });

const transactionSchema = toMongooseSchema(transactionZodSchema);

export const Transaction = models?.Transaction
  ? (models?.Transaction as Model<TransactionDocumentType>)
  : mongoose.model<TransactionDocumentType>('Transaction', transactionSchema);

export { TransactionReasonType };

export const transactionSummaryZodSchema = z.object({
  createdAt: z.date().default(() => new Date()),
  amount: z.number().positive(),
  currency: z.nativeEnum(CurrencyType),
  rate: z.number().positive().default(0),
  transaction: mongooseZodCustomType('ObjectId')
    .optional()
    .mongooseTypeOptions({
      ref: 'Transaction'
    })
});

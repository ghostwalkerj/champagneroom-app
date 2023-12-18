import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';
import { toZodMongooseSchema } from 'mongoose-zod';
import validator from 'validator';

import { CurrencyType, TransactionReason } from '$lib/constants';

export type TransactionDocument = InstanceType<typeof Transaction>;

export type TransactionDocumentType = z.infer<typeof transactionZodSchema>;

const { models } = pkg;

const transactionZodSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true,
        get: (value) => value?.toString()
      }),
      hash: z.string().trim().optional(),
      from: z.string().trim().optional(),
      to: z.string().trim().optional(),
      confirmations: z.number().min(0).optional(),
      reason: z.nativeEnum(TransactionReason).optional(),
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
      ticket: mongooseZodCustomType('ObjectId')
        .optional()
        .mongooseTypeOptions({
          ref: 'Ticket',
          get: (value) => value?.toString()
        }),
      creator: mongooseZodCustomType('ObjectId')
        .optional()
        .mongooseTypeOptions({
          ref: 'Creator',
          get: (value) => value?.toString()
        }),
      agent: mongooseZodCustomType('ObjectId')
        .optional()
        .mongooseTypeOptions({
          ref: 'Agent',
          get: (value) => value?.toString()
        }),
      show: mongooseZodCustomType('ObjectId')
        .optional()
        .mongooseTypeOptions({
          ref: 'Show',
          get: (value) => value?.toString()
        }),
      bcPayoutId: z.string().trim().optional()
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'transactions'
    }
  }
);

const transactionSchema = toMongooseSchema(transactionZodSchema);

export const Transaction = models?.Transaction
  ? (models?.Transaction as Model<TransactionDocumentType>)
  : mongoose.model<TransactionDocumentType>('Transaction', transactionSchema);

export { TransactionReason as TransactionReasonType } from '$lib/constants';

import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  toZodMongooseSchema,
  z
} from 'mongoose-zod';
import validator from 'validator';

import { CurrencyType, TransactionReason } from '$lib/constants';

export type TransactionDocument = InstanceType<typeof Transaction>;

export type TransactionDocumentType = z.infer<
  typeof transactionZodMongooseSchema
>;

const { models } = pkg;

const transactionZodMongooseSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true
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
      total: z
        .string()
        .refine((value) => validator.isNumeric(value), {
          message: 'Total must be numeric'
        })
        .optional(),
      currency: z.nativeEnum(CurrencyType),
      ticket: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
        ref: 'Ticket'
      }),
      creator: mongooseZodCustomType('ObjectId')
        .optional()
        .mongooseTypeOptions({
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
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'transactions'
    }
  }
);

const transactionMongooseSchema = toMongooseSchema(
  transactionZodMongooseSchema
);

export const Transaction = models?.Transaction
  ? (models?.Transaction as Model<TransactionDocumentType>)
  : mongoose.model<TransactionDocumentType>(
      'Transaction',
      transactionMongooseSchema
    );

export { TransactionReason as TransactionReasonType } from '$lib/constants';

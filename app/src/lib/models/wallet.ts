import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  toZodMongooseSchema,
  z
} from 'mongoose-zod';

import { CurrencyType } from '$lib/constants';

import { earningsSchema, payoutSchema } from './common';

const { models } = pkg;

export type WalletDocument = InstanceType<typeof Wallet>;

enum WalletStatus {
  AVAILABLE = 'AVAILABLE',
  PAYOUT_IN_PROGRESS = 'PAYOUT IN PROGRESS'
}

const earningsZodMongooseSchema = toZodMongooseSchema(earningsSchema, {
  typeOptions: {
    show: {
      ref: 'Show'
    }
  }
});

const payoutZodMongooseSchema = toZodMongooseSchema(payoutSchema, {
  typeOptions: {
    transaction: {
      ref: 'Transaction'
    }
  }
});

const walletSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      _id: true,
      auto: true
    }),
    status: z.nativeEnum(WalletStatus).default(WalletStatus.AVAILABLE),
    currency: z.nativeEnum(CurrencyType).default(CurrencyType.ETH),
    balance: z.number().default(0),
    availableBalance: z.number().default(0),
    onHoldBalance: z.number().default(0),
    earnings: z.array(earningsZodMongooseSchema).default([]),
    payouts: z.array(payoutZodMongooseSchema).default([]),
    active: z.boolean().default(true).mongooseTypeOptions({
      index: true
    })
  })
  .merge(genTimestampsSchema());

const walletZodMongooseSchema = toZodMongooseSchema(walletSchema, {
  schemaOptions: {
    collection: 'wallets'
  }
});
const walletMongooseSchema = toMongooseSchema(walletZodMongooseSchema);

export type WalletDocumentType = z.infer<typeof walletZodMongooseSchema>;

export const Wallet = models?.Wallet
  ? (models.Wallet as Model<WalletDocumentType>)
  : mongoose.model<WalletDocumentType>('Wallet', walletMongooseSchema);

export { WalletStatus };

export const atomicUpdateCallback = async (
  query: object,
  update: object,
  options: { returnDocument?: 'before' | 'after' } = {}
) => {
  options.returnDocument = 'after';
  return (await Wallet.findOneAndUpdate(
    query,
    update,
    options
  ).exec()) as WalletDocument;
};

export { walletMongooseSchema };

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

import { earningsZodSchema, payoutZodSchema } from './common';

const { models } = pkg;

export type WalletDocument = InstanceType<typeof Wallet>;

enum WalletStatus {
  AVAILABLE = 'AVAILABLE',
  PAYOUT_IN_PROGRESS = 'PAYOUT IN PROGRESS'
}

const earningsZodMongooseSchema = toZodMongooseSchema(earningsZodSchema, {
  typeOptions: {
    show: {
      ref: 'Show'
    }
  }
});

const payoutZodMongooseSchema = toZodMongooseSchema(payoutZodSchema, {
  typeOptions: {
    transaction: {
      ref: 'Transaction'
    }
  }
});

const walletZodMongooseSchema = toZodMongooseSchema(
  z
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
      active: z.boolean().default(true)
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'wallets'
    }
  }
);
const walletSchema = toMongooseSchema(walletZodMongooseSchema);

export type WalletDocumentType = z.infer<typeof walletZodMongooseSchema>;

export const Wallet = models?.Wallet
  ? (models.Wallet as Model<WalletDocumentType>)
  : mongoose.model<WalletDocumentType>('Wallet', walletSchema);

export { WalletStatus };

export const atomicUpdateCallback = async (
  query: object,
  update: object,
  options: object = {}
) => {
  options['returnDocument'] = 'after';
  return (await Wallet.findOneAndUpdate(
    query,
    update,
    options
  ).exec()) as WalletDocument;
};

export { walletSchema };

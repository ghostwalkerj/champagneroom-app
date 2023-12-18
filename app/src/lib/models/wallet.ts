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

const walletZodSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true,
        get: (value) => value?.toString()
      }),
      status: z.nativeEnum(WalletStatus).default(WalletStatus.AVAILABLE),
      currency: z.nativeEnum(CurrencyType).default(CurrencyType.ETH),
      balance: z.number().default(0),
      availableBalance: z.number().default(0),
      onHoldBalance: z.number().default(0),
      earnings: z.array(earningsZodSchema).default([]),
      payouts: z.array(payoutZodSchema).default([]),
      active: z.boolean().default(true)
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'wallets'
    }
  }
);
const walletSchema = toMongooseSchema(walletZodSchema);

export type WalletDocumentType = z.infer<typeof walletZodSchema>;

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

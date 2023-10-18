import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';

import { CurrencyType, earningsSchema } from './common';
import { transactionSummary } from './transaction';

const { Schema, models } = pkg;

const walletSchema = new mongoose.Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    currency: {
      type: String,
      enum: CurrencyType,
      required: true,
      default: CurrencyType.ETH
    },
    balance: {
      type: Number,
      required: true,
      default: 0
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 0
    },
    earnings: {
      type: [earningsSchema],
      default: () => [],
      required: true
    },
    payouts: {
      type: [transactionSummary],
      default: () => [],
      required: true
    },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const Wallet = models?.Wallet
  ? (models.Wallet as Model<WalletDocumentType>)
  : mongoose.model<WalletDocumentType>('Wallet', walletSchema);

export type WalletDocumentType = InferSchemaType<typeof walletSchema>;

export type WalletType = InstanceType<typeof Wallet>;

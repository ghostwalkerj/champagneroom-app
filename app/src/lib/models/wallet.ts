import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';

import { CurrencyType, earningsSchema, payoutSchema } from './common';

const { Schema, models } = pkg;

export type WalletDocumentType = InferSchemaType<typeof walletSchema>;

enum WalletStatus {
  AVAILABLE = 'AVAILABLE',
  PAYOUT_IN_PROGRESS = 'PAYOUT IN PROGRESS'
}

const walletSchema = new mongoose.Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    status: {
      type: String,
      enum: WalletStatus,
      required: true,
      default: WalletStatus.AVAILABLE
    },
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
    onHoldBalance: {
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
      type: [payoutSchema],
      default: () => [],
      required: true
    },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export type WalletType = InstanceType<typeof Wallet>;

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
  ).exec()) as WalletDocumentType;
};

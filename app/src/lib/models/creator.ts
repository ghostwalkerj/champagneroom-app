import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';

import { userSchema } from './common';

const { Schema, models } = pkg;

const feedbackSchema = new Schema({
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    required: true
  },
  numberOfReviews: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  }
});

const salesSchema = new Schema({
  totalSales: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  },
  numberOfCompletedShows: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  },
  totalRefunded: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  }
});

const creatorSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },

    user: {
      type: userSchema,
      required: true,
      index: true
    },
    profileImageUrl: {
      type: String,
      required: true
    },
    agentCommission: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent'},
    feedbackStats: {
      type: feedbackSchema,
      required: true,
      default: () => ({})
    },
    salesStats: { type: salesSchema, required: true, default: () => ({}) }
  },
  { timestamps: true }
);

export const Creator = models?.Creator
  ? (models?.Creator as Model<CreatorDocumentType>)
  : mongoose.model<CreatorDocumentType>('Creator', creatorSchema);

export type CreatorDocumentType = InferSchemaType<typeof creatorSchema>;

export type CreatorType = InstanceType<typeof Creator>;

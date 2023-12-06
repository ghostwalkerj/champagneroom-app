import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';

import type { UserDocumentType } from './user';

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
  totalRevenue: {
    type: Map,
    required: true,
    of: Number,
    default: () => new Map<string, number>()
  },
  numberOfCompletedShows: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  },
  totalTicketSalesAmounts: {
    type: Map,
    required: true,
    of: Number,
    default: () => new Map<string, number>()
  },
  totalSales: {
    type: Map,
    required: true,
    of: Number,
    default: () => new Map<string, number>()
  },
  totalRefunds: {
    type: Map,
    required: true,
    of: Number,
    default: () => new Map<string, number>()
  }
});

const creatorSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      autopopulate: true
    },

    commissionRate: {
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
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    feedbackStats: {
      type: feedbackSchema,
      required: true,
      default: () => ({})
    },
    salesStats: { type: salesSchema, required: true, default: () => ({}) }
  },
  { timestamps: true }
);

creatorSchema.plugin(mongooseAutoPopulate);

export type CreatorDocument = InstanceType<typeof Creator>;

export type CreatorDocumentType = InferSchemaType<typeof creatorSchema> & {
  user: UserDocumentType;
};

export const Creator = models?.Creator
  ? (models?.Creator as Model<CreatorDocumentType>)
  : mongoose.model<CreatorDocumentType>('Creator', creatorSchema);

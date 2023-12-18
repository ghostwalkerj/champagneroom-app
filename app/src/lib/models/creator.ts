import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  toZodMongooseSchema,
  z
} from 'mongoose-zod';

import { feedbackStatsZodSchema, salesStatsZodSchema } from './common';
import type { UserDocument } from './user';

const { models } = pkg;

const creatorZodSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true,
        get: (value) => value?.toString()
      }),
      user: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        autopopulate: true,
        ref: 'User',
        required: true
      }),
      commissionRate: z.number().min(0).max(100).default(0),
      agent: mongooseZodCustomType('ObjectId')
        .optional()
        .mongooseTypeOptions({
          ref: 'Agent',
          get: (value) => value?.toString()
        }),
      feedbackStats: feedbackStatsZodSchema.default({}),
      salesStats: salesStatsZodSchema.default({
        numberOfCompletedShows: 0,
        totalRefunds: {},
        totalRevenue: {},
        totalSales: {},
        totalTicketSalesAmounts: {}
      })
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'creators'
    }
  }
);
const creatorSchema = toMongooseSchema(creatorZodSchema);
creatorSchema.plugin(mongooseAutoPopulate);

export type CreatorDocument = InstanceType<typeof Creator> & {
  user: UserDocument;
};

export type CreatorDocumentType = z.infer<typeof creatorZodSchema>;
export const Creator = models?.Creator
  ? (models?.Creator as Model<CreatorDocumentType>)
  : mongoose.model<CreatorDocumentType>('Creator', creatorSchema);

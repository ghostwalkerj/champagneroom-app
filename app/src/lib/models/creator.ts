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

import { creatorSalesStatsSchema, feedbackStatsSchema } from './common';
import type { UserDocument } from './user';

const { models } = pkg;

const creatorSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true
      }),
      room: mongooseZodCustomType('ObjectId')
        .mongooseTypeOptions({
          ref: 'Room',
          index: true
        })
        .optional(),
      user: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        autopopulate: true,
        ref: 'User',
        required: true
      }),

      commissionRate: z.number().min(0).max(100).default(0),
      agent: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
        ref: 'Agent'
      }),
      feedbackStats: feedbackStatsSchema.default({}),
      salesStats: creatorSalesStatsSchema.default({
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
const creatorMongooseSchema = toMongooseSchema(creatorSchema);
creatorMongooseSchema.plugin(mongooseAutoPopulate);

export type CreatorDocument = InstanceType<typeof Creator> & {
  user: UserDocument;
};

export type CreatorDocumentType = z.infer<typeof creatorSchema>;
export const Creator = models?.Creator
  ? (models?.Creator as Model<CreatorDocumentType>)
  : mongoose.model<CreatorDocumentType>('Creator', creatorMongooseSchema);

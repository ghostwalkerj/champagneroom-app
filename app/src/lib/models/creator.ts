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
import { userCRUDSchema, type UserDocument } from './user';

const { models } = pkg;

const creatorSchema = z
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
  .merge(genTimestampsSchema());

const creatorMongooseZodSchema = toZodMongooseSchema(creatorSchema, {
  schemaOptions: {
    collection: 'creators'
  }
});

const creatorCRUDSchema = creatorSchema.extend({
  _id: creatorSchema.shape._id.optional(),
  user: userCRUDSchema.required()
});

const creatorMongooseSchema = toMongooseSchema(creatorMongooseZodSchema);
creatorMongooseSchema.plugin(mongooseAutoPopulate);

type CreatorDocument = InstanceType<typeof Creator> & {
  user: UserDocument;
};

type CreatorDocumentType = z.infer<typeof creatorSchema>;
const Creator = models?.Creator
  ? (models?.Creator as Model<CreatorDocumentType>)
  : mongoose.model<CreatorDocumentType>('Creator', creatorMongooseSchema);

export type { CreatorDocument, CreatorDocumentType };
export { Creator, creatorCRUDSchema, creatorSchema };

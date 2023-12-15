import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';

import type { UserDocument } from './user';

const { models } = pkg;

const salesZodSchema = z
  .object({
    totalRevenue: z.record(z.number()).default({}),
    numberOfCompletedShows: z.number().min(0).default(0),
    totalTicketSalesAmounts: z.record(z.number()).default({}),
    totalSales: z.record(z.number()).default({}),
    totalRefunds: z.record(z.number()).default({})
  })
  .strict();

const feedbackZodSchema = z
  .object({
    averageRating: z.number().min(0).max(5).default(0),
    numberOfReviews: z.number().min(0).default(0)
  })
  .strict();

const creatorZodSchema = z
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
    feedbackStats: feedbackZodSchema.default({
      averageRating: 0,
      numberOfReviews: 0
    }),
    salesStats: salesZodSchema.default({
      numberOfCompletedShows: 0,
      totalRefunds: {},
      totalRevenue: {},
      totalSales: {},
      totalTicketSalesAmounts: {}
    })
  })
  .merge(genTimestampsSchema())
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'creators'
    }
  });

const creatorSchema = toMongooseSchema(creatorZodSchema);
creatorSchema.plugin(mongooseAutoPopulate);

export type CreatorDocument = InstanceType<typeof Creator> & {
  user: UserDocument;
};

export type CreatorDocumentType = z.infer<typeof creatorZodSchema>;
export const Creator = models?.Creator
  ? (models?.Creator as Model<CreatorDocumentType>)
  : mongoose.model<CreatorDocumentType>('Creator', creatorSchema);

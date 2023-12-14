import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';

import type { UserDocumentType } from './user';

const { models } = pkg;

const salesZodSchema = z
  .object({
    totalRevenue: z
      .map(z.string(), z.number())
      .default(() => new Map<string, number>()),
    numberOfCompletedShows: z.number().min(0).default(0),
    totalTicketSalesAmounts: z
      .map(z.string(), z.number())
      .default(() => new Map<string, number>()),
    totalSales: z
      .map(z.string(), z.number())
      .default(() => new Map<string, number>()),
    totalRefunds: z
      .map(z.string(), z.number())
      .default(() => new Map<string, number>())
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
    _id: mongooseZodCustomType('ObjectId')
      .default(() => new mongoose.Types.ObjectId())
      .mongooseTypeOptions({ _id: true })
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
    feedbackStats: feedbackZodSchema.default({}),
    salesStats: salesZodSchema.default({})
  })
  .merge(genTimestampsSchema('createdAt', 'updatedAt'))
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'creators'
    }
  });

const creatorSchema = toMongooseSchema(creatorZodSchema);

export type CreatorDocument = InstanceType<typeof Creator> & {
  user: UserDocumentType;
};

export type CreatorDocumentType = z.infer<typeof creatorZodSchema>;
export const Creator = models?.Creator
  ? (models?.Creator as Model<CreatorDocumentType>)
  : mongoose.model<CreatorDocumentType>('Creator', creatorSchema);

creatorSchema.plugin(mongooseAutoPopulate);

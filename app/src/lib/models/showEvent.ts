import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  toZodMongooseSchema,
  z
} from 'mongoose-zod';

const { models } = pkg;

const showEventSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true
      }),
      type: z.string(),
      show: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Show'
      }),
      creator: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Creator'
      }),
      agent: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
        ref: 'Agent'
      }),
      ticket: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
        ref: 'Ticket'
      }),
      transaction: mongooseZodCustomType('ObjectId')
        .optional()
        .mongooseTypeOptions({
          ref: 'Transaction'
        }),
      ticketInfo: z
        .object({
          customerName: z.string().trim().optional()
        })
        .optional()
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'showevents'
    }
  }
);

const showeventSchema = toMongooseSchema(showEventSchema);
showeventSchema.index({ show: 1, createdAt: -1 });

export type ShowEventDocument = InstanceType<typeof ShowEvent>;

export type ShowEventDocumentType = z.infer<typeof showEventSchema>;

export const ShowEvent = models?.ShowEvent
  ? (models.ShowEvent as Model<ShowEventDocumentType>)
  : mongoose.model<ShowEventDocumentType>('ShowEvent', showeventSchema);

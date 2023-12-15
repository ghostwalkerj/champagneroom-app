import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';

import type { ShowDocumentType } from './show';
import type { TransactionDocumentType } from './transaction';
const { models } = pkg;

const showEventZodSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      _id: true,
      auto: true,
      get: (value) => value?.toString()
    }),
    type: z.string(),
    show: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      ref: 'Show',
      get: (value) => value?.toString()
    }),
    creator: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      ref: 'Creator',
      get: (value) => value?.toString()
    }),
    agent: mongooseZodCustomType('ObjectId')
      .optional()
      .mongooseTypeOptions({
        ref: 'Agent',
        get: (value) => value?.toString()
      }),
    ticket: mongooseZodCustomType('ObjectId')
      .optional()
      .mongooseTypeOptions({
        ref: 'Ticket',
        get: (value) => value?.toString()
      }),
    transaction: mongooseZodCustomType('ObjectId')
      .optional()
      .mongooseTypeOptions({
        ref: 'Transaction',
        get: (value) => value?.toString()
      }),
    ticketInfo: z
      .object({
        customerName: z.string().trim().optional()
      })
      .optional()
  })
  .merge(genTimestampsSchema())
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'showevents'
    }
  });

const showeventSchema = toMongooseSchema(showEventZodSchema);
showeventSchema.index({ show: 1, createdAt: -1 });

export type ShowEventDocument = InstanceType<typeof ShowEvent>;

export type ShowEventDocumentType = z.infer<typeof showEventZodSchema>;

export const ShowEvent = models?.ShowEvent
  ? (models.ShowEvent as Model<ShowEventDocumentType>)
  : mongoose.model<ShowEventDocumentType>('ShowEvent', showeventSchema);

export const createShowEvent = ({
  show,
  type,
  ticketId,
  transaction,
  ticketInfo
}: {
  show: ShowDocumentType;
  type: string;
  ticketId?: string;
  transaction?: TransactionDocumentType;
  ticketInfo?: { customerName: string };
}) => {
  ShowEvent.create({
    show: show._id,
    type,
    ticketId,
    transaction: transaction?._id,
    agent: show.agent,
    creator: show.creator,
    ticketInfo
  });
};

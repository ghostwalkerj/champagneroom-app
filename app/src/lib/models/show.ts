import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  toZodMongooseSchema,
  z
} from 'mongoose-zod';
import { nanoid } from 'nanoid';

import { ShowStatus } from '$lib/constants';

import {
  cancelSchema,
  creatorInfoSchema,
  disputeStatsSchema,
  escrowSchema,
  feedbackStatsSchema,
  finalizeSchema,
  moneySchema,
  runtimeSchema,
  showSalesStatsSchema
} from './common';
import { ShowEvent } from './showEvent';
import type { TransactionDocumentType } from './transaction';

const { models } = pkg;

const showStateSchema = z.object({
  status: z.nativeEnum(ShowStatus).default(ShowStatus.CREATED),
  active: z.boolean().default(true),
  salesStats: showSalesStatsSchema.default({}),
  feedbackStats: feedbackStatsSchema.default({}),
  disputeStats: disputeStatsSchema.default({}),
  cancel: cancelSchema.optional(),
  finalize: finalizeSchema.optional(),
  escrow: escrowSchema.optional(),
  runtime: runtimeSchema.optional(),
  refunds: z
    .array(
      mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Ticket'
      })
    )
    .default([]),
  sales: z
    .array(
      mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Ticket'
      })
    )
    .default([]),
  disputes: z
    .array(
      mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Ticket'
      })
    )
    .default([]),
  reservations: z
    .array(
      mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Ticket'
      })
    )
    .default([]),
  redemptions: z
    .array(
      mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Ticket'
      })
    )
    .default([]),
  finalizations: z
    .array(
      mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Ticket'
      })
    )
    .default([]),
  cancellations: z
    .array(mongooseZodCustomType('ObjectId'))
    .mongooseTypeOptions({
      ref: 'Ticket'
    })
    .default([]),
  current: z.boolean().default(true)
});

const showSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      _id: true,
      auto: true
    }),
    creator: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      ref: 'Creator'
    }),
    agent: mongooseZodCustomType('ObjectId')
      .mongooseTypeOptions({
        ref: 'Agent'
      })
      .optional(),
    conferenceKey: z.string().default(nanoid),
    coverImageUrl: z.string().trim().optional(),
    duration: z
      .number()
      .min(10, { message: 'Duration must be at least 5 minutes' })
      .max(180, { message: 'Duration must be under 180 minutes' })
      .default(10),
    name: z
      .string()
      .min(3, { message: 'Name must be at least 3 characters' })
      .max(50, { message: 'Name must be under 50 characters' })
      .trim(),
    capacity: z.number().min(1).default(1),
    price: moneySchema.default({}),
    creatorInfo: creatorInfoSchema,
    showState: showStateSchema.default({})
  })
  .merge(genTimestampsSchema());

const showCRUDSchema = showSchema.extend({
  _id: showSchema.shape._id.optional(),
  creator: showSchema.shape.creator.optional()
});

const showZodMongooseSchema = toZodMongooseSchema(showSchema, {
  schemaOptions: {
    collection: 'shows'
  }
});

const showMongooseSchema = toMongooseSchema(showZodMongooseSchema);

showMongooseSchema.methods.saveShowEvent = async function (
  type: string,
  ticketId?: string,
  transaction?: TransactionDocumentType,
  ticketInfo?: { customerName: string }
) {
  await ShowEvent.create({
    show: this._id,
    type,
    ticket: ticketId,
    transaction: transaction?._id,
    agent: this.agent,
    creator: this.creator,
    ticketInfo
  });
};

const Show = models?.Show
  ? (models.Ticket as Model<ShowDocumentType>)
  : mongoose.model<ShowDocumentType>('Show', showMongooseSchema);

type ShowDocument = InstanceType<typeof Show> & {
  saveShowEvent: (
    type: string,
    ticketId?: string,
    transaction?: TransactionDocumentType,
    ticketInfo?: { customerName: string }
  ) => Promise<void>;
};

type ShowStateType = z.infer<typeof showStateSchema>;

type ShowDocumentType = z.infer<typeof showSchema>;

showMongooseSchema.index({ agent: 1, 'showState.finalize.finalizedAt': -1 });
showMongooseSchema.plugin(fieldEncryption, {
  fields: ['conferenceKey'],
  secret: process.env.MONGO_DB_FIELD_SECRET,
  saltGenerator: (secret: string) => secret.slice(0, 16)
});

export type { ShowDocument, ShowDocumentType, ShowStateType };
export { Show, showCRUDSchema, showSchema };

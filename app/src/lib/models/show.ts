import { default as pkg } from 'mongoose';
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
  cancelZodSchema,
  creatorInfoZodSchema,
  disputeStatsZodSchema,
  escrowZodSchema,
  feedbackStatsZodSchema,
  finalizeZodSchema,
  moneyZodSchema,
  runtimeZodSchema,
  showSalesStatsZodSchema
} from './common';

const showStateZodSchema = z.object({
  status: z.nativeEnum(ShowStatus).default(ShowStatus.CREATED),
  active: z.boolean().default(true),
  salesStats: showSalesStatsZodSchema.default({}),
  feedbackStats: feedbackStatsZodSchema.default({}),
  disputeStats: disputeStatsZodSchema.default({}),
  cancel: cancelZodSchema.optional(),
  finalize: finalizeZodSchema.optional(),
  escrow: escrowZodSchema.optional(),
  runtime: runtimeZodSchema.optional(),
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

const showZodSchema = z
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
      .min(0, { message: 'Duration must be a positive number' })
      .max(180, { message: 'Duration must be under 180 minutes' }),
    name: z
      .string()
      .min(3, { message: 'Name must be at least 3 characters' })
      .max(50, { message: 'Name must be under 50 characters' })
      .trim(),
    capacity: z.number().min(1).default(1),
    price: moneyZodSchema.default({}),
    creatorInfo: creatorInfoZodSchema,
    showState: showStateZodSchema.default({})
  })
  .merge(genTimestampsSchema());

const showCRUDSchema = showZodSchema.extend({
  _id: showZodSchema.shape._id.optional(),
  creator: showZodSchema.shape.creator.optional()
});

const showZodMongooseSchema = toZodMongooseSchema(showZodSchema, {
  schemaOptions: {
    collection: 'shows'
  }
});

const showMongooseSchema = toMongooseSchema(showZodMongooseSchema);
const Show = pkg.models.Show ?? pkg.model('Show', showMongooseSchema);

type ShowDocument = InstanceType<typeof Show>;

type ShowStateType = z.infer<typeof showStateZodSchema>;

type ShowDocumentType = z.infer<typeof showZodSchema>;

showMongooseSchema.index({ agent: 1, 'showState.finalize.finalizedAt': -1 });
showMongooseSchema.plugin(fieldEncryption, {
  fields: ['conferenceKey'],
  secret: process.env.MONGO_DB_FIELD_SECRET,
  saltGenerator: (secret: string) => secret.slice(0, 16)
});

const SaveState = (show: ShowDocument, newState: ShowStateType) => {
  Show.updateOne({ _id: show._id }, { $set: { showState: newState } }).exec();
};

export type { ShowDocument, ShowDocumentType, ShowStateType };
export { SaveState, Show, showCRUDSchema, showZodSchema };

import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';
import { nanoid } from 'nanoid';
import { merge } from 'rxjs';

import { CurrencyType } from '$lib/constants';

import type { refundZodSchema, saleZodSchema } from './common';
import {
  cancelZodSchema,
  escrowZodSchema,
  finalizeZodSchema,
  moneyZodSchema
} from './common';

const { models } = pkg;
export type ShowDocument = InstanceType<typeof Show>;

enum ShowStatus {
  CREATED = 'CREATED',
  BOX_OFFICE_OPEN = 'BOX OFFICE OPEN',
  BOX_OFFICE_CLOSED = 'BOX OFFICE CLOSED',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  CANCELLATION_INITIATED = 'CANCELLATION INITIATED',
  REFUND_INITIATED = 'REFUND INITIATED',
  LIVE = 'LIVE',
  STOPPED = 'STOPPED',
  IN_ESCROW = 'IN ESCROW',
  IN_DISPUTE = 'IN DISPUTE'
}

export type ShowDocumentType = z.infer<typeof showZodSchema>;

const disputeStatsZodSchema = z
  .object({
    totalDisputes: z.number().positive().default(0),
    totalDisputesRefunded: z.number().positive().default(0),
    totalDisputesResolved: z.number().positive().default(0),
    totalDisputesPending: z.number().positive().default(0)
  })
  .strict();

const feedbackStatsZodSchema = z
  .object({
    numberOfReviews: z.number().positive().default(0),
    averageRating: z.number().positive().default(0),
    comments: z.array(z.string().trim()).default([])
  })
  .strict();

const salesStatsZodSchema = z
  .object({
    ticketsAvailable: z.number().positive().default(0),
    ticketsSold: z.number().positive().default(0),
    ticketsReserved: z.number().positive().default(0),
    ticketsRefunded: z.number().positive().default(0),
    ticketsFinalized: z.number().positive().default(0),
    ticketsRedeemed: z.number().positive().default(0),
    ticketSalesAmount: moneyZodSchema.default({
      amount: 0,
      currency: CurrencyType.USD
    }),
    totalSales: z
      .map(z.string(), z.number())
      .default(() => new Map<string, number>()),
    totalRevenue: z
      .map(z.string(), z.number())
      .default(() => new Map<string, number>()),
    totalRefunds: z
      .map(z.string(), z.number())
      .default(() => new Map<string, number>())
  })
  .strict();

const runtimeZodSchema = z
  .object({
    startDate: z.date().default(() => new Date()),
    endDate: z.date().optional()
  })
  .strict();

export type ShowRefundType = z.infer<typeof refundZodSchema>;

export type ShowSaleType = z.infer<typeof saleZodSchema>;

export type ShowStateType = z.infer<typeof showStateZodSchema>;

export const SaveState = (show: ShowDocument, newState: ShowStateType) => {
  Show.updateOne({ _id: show._id }, { $set: { showState: newState } }).exec();
};

const creatorInfoZodSchema = z.object({
  name: z.string().trim(),
  profileImageUrl: z.string().trim(),
  averageRating: z.number().positive().max(5).default(0),
  numberOfReviews: z.number().positive().default(0)
});

const showStateZodSchema = z
  .object({
    status: z.nativeEnum(ShowStatus).default(ShowStatus.CREATED),
    active: z.boolean().default(true).mongooseTypeOptions({ index: true }),
    salesStats: salesStatsZodSchema.default({
      ticketsAvailable: 0,
      ticketsSold: 0,
      ticketsReserved: 0,
      ticketsRefunded: 0,
      ticketsFinalized: 0,
      ticketsRedeemed: 0,
      ticketSalesAmount: {
        amount: 0,
        currency: CurrencyType.USD
      },
      totalSales: new Map<string, number>(),
      totalRevenue: new Map<string, number>(),
      totalRefunds: new Map<string, number>()
    }),
    feedbackStats: feedbackStatsZodSchema.default({}),
    disputeStats: disputeStatsZodSchema.default({}),
    cancel: cancelZodSchema.optional(),
    finalize: finalizeZodSchema.optional(),
    escrow: escrowZodSchema.optional(),
    runtime: runtimeZodSchema.optional(),
    refunds: z
      .array(mongooseZodCustomType('ObjectId'))
      .mongooseTypeOptions({
        ref: 'Ticket.ticketState.refund'
      })
      .default([]),
    sales: z
      .array(mongooseZodCustomType('ObjectId'))
      .mongooseTypeOptions({
        ref: 'Ticket.ticketState.sale'
      })
      .default([]),
    disputes: z
      .array(mongooseZodCustomType('ObjectId'))
      .mongooseTypeOptions({
        ref: 'Ticket.ticketState.dispute'
      })
      .default([]),
    reservations: z
      .array(mongooseZodCustomType('ObjectId'))
      .mongooseTypeOptions({
        ref: 'Ticket'
      })
      .default([]),
    redemptions: z
      .array(mongooseZodCustomType('ObjectId'))
      .mongooseTypeOptions({
        ref: 'Ticket'
      })
      .default([]),
    finalizations: z
      .array(mongooseZodCustomType('ObjectId'))
      .mongooseTypeOptions({
        ref: 'Ticket'
      })
      .default([]),
    cancellations: z
      .array(mongooseZodCustomType('ObjectId'))
      .mongooseTypeOptions({
        ref: 'Ticket'
      })
      .default([]),
    current: z.boolean().default(true).mongooseTypeOptions({ index: true })
  })
  .strict();

const showZodSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId')
      .default(() => new mongoose.Types.ObjectId())
      .mongooseTypeOptions({ _id: true })
      .optional(),
    creator: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      ref: 'Creator'
    }),
    agent: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
      ref: 'Agent'
    }),
    roomId: z.string().default(nanoid),
    coverImageUrl: z.string().trim().optional(),
    duration: z
      .number()
      .min(0, { message: 'Duration must be over 0' })
      .max(180, { message: 'Duration must be under 180 minutes' }),
    name: z
      .string()
      .min(3, { message: 'Name must be at least 3 characters' })
      .max(50, { message: 'Name must be under 50 characters' })
      .trim(),
    capacity: z.number().min(1),
    price: moneyZodSchema.default({ amount: 0, currency: CurrencyType.USD }),
    creatorInfo: creatorInfoZodSchema,
    showState: showStateZodSchema.default({})
  })
  .merge(genTimestampsSchema('createdAt', 'updatedAt'))
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'shows'
    }
  });

const showSchema = toMongooseSchema(showZodSchema);
showSchema.index({ agent: 1, 'showState.finalize.finalizedAt': -1 });
showSchema.plugin(fieldEncryption, {
  fields: ['roomId'],
  secret: process.env.MONGO_DB_FIELD_SECRET,
  saltGenerator: (secret: string) => secret.slice(0, 16)
});

export const Show = models?.Show
  ? (models.Show as Model<ShowDocumentType>)
  : mongoose.model<ShowDocumentType>('Show', showSchema);

export { ShowStatus };

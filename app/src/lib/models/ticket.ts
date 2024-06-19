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
import validator from 'validator';

import { TicketStatus } from '$lib/constants';

import {
    cancelSchema,
    escrowSchema,
    finalizeSchema,
    moneySchema,
    redemptionSchema,
    refundSchema,
    ticketDisputeSchema,
    ticketFeedbackSchema,
    ticketSaleSchema
} from './common';
import type { ShowDocument } from './show';
import type { UserDocument } from './user';

const { models } = pkg;

const ticketStateSchema = z.object({
  status: z.nativeEnum(TicketStatus).default(TicketStatus.CREATED),
  isActive: z.boolean().default(true),
  cancel: cancelSchema.optional(),
  redemption: redemptionSchema.optional(),
  escrow: escrowSchema.optional(),
  dispute: ticketDisputeSchema.optional(),
  finalize: finalizeSchema.optional(),
  feedback: ticketFeedbackSchema.optional(),
  refund: refundSchema.optional(),
  sale: ticketSaleSchema.optional()
});

const ticketSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true
      }),
      paymentAddress: z
        .string()
        .max(50)
        .trim()
        .refine((value) => validator.isEthereumAddress(value), {
          message: 'Invalid Ethereum address'
        })
        .optional(),
      price: moneySchema,
      show: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Show'
      }),
      bcInvoiceId: z.string().trim().optional(),
      ticketState: ticketStateSchema.default({}),
      user: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        autopopulate: true,
        ref: 'User'
      }),
      agent: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
        ref: 'Agent'
      }),
      creator: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Creator'
      })
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'tickets'
    }
  }
);

const ticketMongooseSchema = toMongooseSchema(ticketSchema);

ticketMongooseSchema.plugin(mongooseAutoPopulate);

export type TicketDocument = InstanceType<typeof Ticket> & {
  show: ShowDocument;
} & {
  user: UserDocument;
};

export type TicketDocumentType = z.infer<typeof ticketSchema>;

export type TicketStateType = z.infer<typeof ticketStateSchema>;

export const Ticket = models?.Ticket
  ? (models.Ticket as Model<TicketDocumentType>)
  : mongoose.model<TicketDocumentType>('Ticket', ticketMongooseSchema);

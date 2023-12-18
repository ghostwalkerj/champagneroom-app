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

import {
  cancelZodSchema,
  disputeZodSchema,
  escrowZodSchema,
  feedbackZodSchema,
  finalizeZodSchema,
  moneyZodSchema,
  refundZodSchema,
  saleZodSchema
} from './common';
import type { ShowDocument } from './show';
import type { UserDocument } from './user';

enum TicketStatus {
  RESERVED = 'RESERVED',
  REFUND_REQUESTED = 'REFUND REQUESTED',
  PAYMENT_INITIATED = 'PAYMENT INITIATED',
  PAYMENT_RECEIVED = 'PAYMENT RECEIVED',
  WAITING_FOR_REFUND = 'WAITING FOR REFUND',
  FULLY_PAID = 'FULLY PAID',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  REDEEMED = 'REDEEMED',
  IN_ESCROW = 'IN ESCROW',
  IN_DISPUTE = 'IN DISPUTE',
  REFUNDED = 'REFUNDED',
  MISSED_SHOW = 'MISSED SHOW',
  SHOW_CANCELLED = 'SHOW CANCELLED',
  WAITING_FOR_DISPUTE_REFUND = 'WAITING FOR DISPUTE REFUND'
}

const { models } = pkg;
const redemptionZodSchema = z
  .object({
    redeemedAt: z.date().default(() => new Date())
  })
  .strict();

const ticketStateZodSchema = z.object({
  status: z.nativeEnum(TicketStatus).default(TicketStatus.RESERVED),
  active: z.boolean().default(true),
  cancel: cancelZodSchema.optional(),
  redemption: redemptionZodSchema.optional(),
  escrow: escrowZodSchema.optional(),
  dispute: disputeZodSchema.optional(),
  finalize: finalizeZodSchema.optional(),
  feedback: feedbackZodSchema.optional(),
  refund: refundZodSchema.optional(),
  sale: saleZodSchema.optional()
});

const ticketZodSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true,
        get: (value) => value?.toString()
      }),
      paymentAddress: z
        .string()
        .max(50)
        .trim()
        .refine((value) => validator.isEthereumAddress(value), {
          message: 'Invalid Ethereum address'
        })
        .optional(),
      price: moneyZodSchema,
      show: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Show'
      }),
      bcInvoiceId: z.string().trim().optional(),
      ticketState: ticketStateZodSchema.default({}),
      user: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        autopopulate: true,
        ref: 'User',
        required: true
      }),
      agent: mongooseZodCustomType('ObjectId')
        .optional()
        .mongooseTypeOptions({
          ref: 'Agent',
          get: (value) => value?.toString()
        }),
      creator: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        ref: 'Creator',
        get: (value) => value?.toString()
      })
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'tickets'
    }
  }
);

const ticketSchema = toMongooseSchema(ticketZodSchema);

ticketSchema.plugin(mongooseAutoPopulate);

export type TicketDocument = InstanceType<typeof Ticket> & {
  show: ShowDocument;
} & {
  user: UserDocument;
};

export type TicketDocumentType = z.infer<typeof ticketZodSchema>;

export type TicketStateType = z.infer<typeof ticketStateZodSchema>;

export const SaveState = (
  ticket: TicketDocument,
  newState: TicketStateType
) => {
  Ticket.updateOne(
    { _id: ticket._id },
    { $set: { showState: newState } }
  ).exec();
};

export const Ticket = models?.Ticket
  ? (models.Ticket as Model<TicketDocumentType>)
  : mongoose.model<TicketDocumentType>('Ticket', ticketSchema);

export { TicketStatus, redemptionZodSchema };

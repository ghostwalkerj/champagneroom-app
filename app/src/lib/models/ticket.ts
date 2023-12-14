import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { fieldEncryption } from 'mongoose-field-encryption';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';
import { merge } from 'rxjs';
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
import type { ShowDocumentType } from './show';
import type { UserDocumentType } from './user';

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

export type TicketDocument = InstanceType<typeof Ticket> & {
  show: ShowDocumentType;
} & {
  user: UserDocumentType;
};

const ticketStateZodSchema = z
  .object({
    status: z.nativeEnum(TicketStatus).default(TicketStatus.RESERVED),
    active: z.boolean().default(true).mongooseTypeOptions({ index: true }),
    cancel: cancelZodSchema.optional(),
    redemption: redemptionZodSchema.optional(),
    escrow: escrowZodSchema.optional(),
    dispute: disputeZodSchema.optional(),
    finalize: finalizeZodSchema.optional(),
    feedback: feedbackZodSchema.optional(),
    refund: refundZodSchema.optional(),
    sale: saleZodSchema.optional()
  })
  .strict();

const ticketZodSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId')
      .default(() => new mongoose.Types.ObjectId())
      .mongooseTypeOptions({ _id: true })
      .optional(),
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
    agent: mongooseZodCustomType('ObjectId').optional().mongooseTypeOptions({
      ref: 'Agent'
    }),
    creator: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      ref: 'Creator'
    })
  })
  .merge(genTimestampsSchema('createdAt', 'updatedAt'))
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'tickets'
    }
  });

const ticketSchema = toMongooseSchema(ticketZodSchema);

ticketSchema.plugin(mongooseAutoPopulate);

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

export { TicketStatus };

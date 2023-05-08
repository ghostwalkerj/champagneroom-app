import type { InferSchemaType } from 'mongoose';
import mongoose, { Schema, Types } from 'mongoose';

export enum ShowStatus {
  CREATED = 'CREATED',
  BOX_OFFICE_OPEN = 'BOX OFFICE OPEN',
  BOX_OFFICE_CLOSED = 'BOX OFFICE CLOSED',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  CANCELLATION_REQUESTED = 'CANCELLATION REQUESTED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  STOPPED = 'STOPPED',
  IN_ESCROW = 'IN ESCROW',
}

const showSchema = new Schema(
  {
    talent: { type: Types.ObjectId, ref: 'Talent', required: true },
    agent: { type: Types.ObjectId, ref: 'Agent', required: true },
    roomId: { type: String, required: true },
    coverImageUrl: { type: String, trim: true },
    duration: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    maxNumTickets: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

export type ShowDocType = InferSchemaType<typeof showSchema>;

export const Show = mongoose.model<ShowDocType>('Show', showSchema);

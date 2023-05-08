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

const showSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  talent: { type: Types.ObjectId, ref: 'Talent', required: true },
  agent: { type: Types.ObjectId, ref: 'Agent', required: true },
  roomId: { type: String, required: true },
  coverImageUrl: { type: String, trim: true },
  duration: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  maxNumTickets: { type: Number, required: true },
  price: { type: Number, required: true },
});

export const Show = mongoose.model('Show', showSchema);

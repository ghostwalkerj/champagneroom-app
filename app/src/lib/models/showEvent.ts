import type { InferSchemaType } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

const showeventSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    type: { type: String, required: true },
    show: { type: Schema.Types.ObjectId, ref: 'Show', required: true },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  },
  { timestamps: true }
);

export type ShowEventDocType = InferSchemaType<typeof showeventSchema>;

export const ShowEvent = mongoose.model<ShowEventDocType>(
  'ShowEvent',
  showeventSchema
);

import type { InferSchemaType, Model } from 'mongoose';
import mongoose from 'mongoose';
import pkg from 'mongoose';

const { Schema, models } = pkg;
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

showeventSchema.index({ createdAt: 1 });

export type ShowEventDocType = InferSchemaType<typeof showeventSchema>;

export const ShowEvent = (
  models?.ShowEvent
    ? models?.ShowEvent
    : mongoose.model<ShowEventDocType>('ShowEvent', showeventSchema)
) as Model<ShowEventDocType>;

export type ShowEventType = InstanceType<typeof ShowEvent>;

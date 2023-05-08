import type { InferSchemaType } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

const agentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },

    address: {
      type: String,
      required: true,
      maxLength: 50,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

export type AgentDocType = InferSchemaType<typeof agentSchema>;

export const Agent = mongoose.model<AgentDocType>('Agent', agentSchema);

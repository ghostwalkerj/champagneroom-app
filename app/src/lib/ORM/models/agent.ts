import type { InferSchemaType } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

const agentSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

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

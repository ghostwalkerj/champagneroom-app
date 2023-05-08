import type { InferSchemaType } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

const agentSchema = new Schema(
  {
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

export type AgentType = InferSchemaType<typeof agentSchema>;

export const Agent =
  mongoose.models.Agent || mongoose.model<AgentType>('Agent', agentSchema);

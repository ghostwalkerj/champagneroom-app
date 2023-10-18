import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';

import { userSchema } from '$lib/models/common';

const { Schema, models } = pkg;
const agentSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },

    user: {
      type: userSchema,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

export type AgentDocumentType = InferSchemaType<typeof agentSchema>;

export type AgentType = InstanceType<typeof Agent>;

export const Agent = models?.Agent
  ? (models.Agent as Model<AgentDocumentType>)
  : mongoose.model<AgentDocumentType>('Agent', agentSchema);

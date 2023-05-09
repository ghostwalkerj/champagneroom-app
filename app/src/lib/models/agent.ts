import { womensNames } from '$lib/util/womensNames';
import type { InferSchemaType, Model } from 'mongoose';
import { models } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import { uniqueNamesGenerator } from 'unique-names-generator';

const agentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    walletAddress: { type: String, maxLength: 50 },
    name: {
      type: String,
      maxLength: 50,
      minLength: [4, 'Name is too short'],
      required: true,
      trim: true,
      default: function () {
        return uniqueNamesGenerator({
          dictionaries: [womensNames],
        });
      },
    },
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

export const Agent = models.Agent
  ? (models.Agent as Model<AgentDocType>)
  : (mongoose.model<AgentDocType>('Agent', agentSchema) as Model<AgentDocType>);

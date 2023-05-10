import { womensNames } from '$lib/util/womensNames';
import type { InferSchemaType, Model } from 'mongoose';
import mongoose, { Schema, models } from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';
import 'mongoose-valid8';
import { uniqueNamesGenerator } from 'unique-names-generator';
import validator from 'validator';

const agentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    walletAddress: {
      type: String,
      maxLength: 50,
      validator: (v: string) => validator.isEthereumAddress(v),
    },
    name: {
      type: String,
      maxLength: 50,
      minLength: [4, 'Name is too short'],
      required: true,
      trim: true,
      startcase: true,
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
      validator: (v: string) => validator.isEthereumAddress(v),
    },
  },
  { timestamps: true }
);

agentSchema.plugin(findOrCreate);

export type AgentDocType = InferSchemaType<typeof agentSchema>;

export const Agent = models.Agent
  ? (models.Agent as Model<AgentDocType>)
  : (mongoose.model<AgentDocType>('Agent', agentSchema) as Model<AgentDocType>);

export type AgentType = InstanceType<typeof Agent>;

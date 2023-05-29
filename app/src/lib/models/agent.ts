import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { uniqueNamesGenerator } from 'unique-names-generator';
import validator from 'validator';
import { womensNames } from '$util/womensNames';

const { Schema, models } = pkg;
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

export type AgentDocType = InferSchemaType<typeof agentSchema>;

export const Agent = models?.Agent
  ? (models.Agent as Model<AgentDocType>)
  : mongoose.model<AgentDocType>('Agent', agentSchema);

export type AgentType = InstanceType<typeof Agent>;

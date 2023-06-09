import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import validator from 'validator';

const { Schema, models } = pkg;
const agentSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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

export const Agent = models?.Agent
  ? (models.Agent as Model<AgentDocumentType>)
  : mongoose.model<AgentDocumentType>('Agent', agentSchema);

export type AgentDocumentType = InferSchemaType<typeof agentSchema>;

export type AgentType = InstanceType<typeof Agent>;

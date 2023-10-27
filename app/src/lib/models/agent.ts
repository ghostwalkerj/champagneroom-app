import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';

import type { UserDocumentType } from './user';

const { Schema, models } = pkg;
const agentSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      autopopulate: true
    }
  },
  { timestamps: true }
);

agentSchema.plugin(mongooseAutoPopulate);

export type AgentDocument = InstanceType<typeof Agent>;

export type AgentDocumentType = InferSchemaType<typeof agentSchema> & {
  user: UserDocumentType;
};

export const Agent = models?.Agent
  ? (models.Agent as Model<AgentDocumentType>)
  : mongoose.model<AgentDocumentType>('Agent', agentSchema);

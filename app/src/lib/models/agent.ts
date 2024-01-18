import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  toZodMongooseSchema,
  z
} from 'mongoose-zod';

import type { UserDocument } from './user';

const { models } = pkg;

const agentSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true
      }),
      user: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        autopopulate: true,
        ref: 'User',
        required: true
      }),
      defaultCommissionRate: z.number().min(0).max(100).default(0)
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'agents'
    }
  }
);
const agentMongooseSchema = toMongooseSchema(agentSchema);
agentMongooseSchema.plugin(mongooseAutoPopulate);

export type AgentDocument = InstanceType<typeof Agent> & {
  user: UserDocument;
};

export type AgentDocumentType = z.infer<typeof agentSchema>;

export const Agent = models?.Agent
  ? (models.Agent as Model<AgentDocumentType>)
  : mongoose.model<AgentDocumentType>('Agent', agentMongooseSchema);

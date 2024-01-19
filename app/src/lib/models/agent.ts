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

const agentSchema = z
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
  .merge(genTimestampsSchema());

const agentZodMongooseSchema = toZodMongooseSchema(agentSchema, {
  schemaOptions: {
    collection: 'agents'
  }
});

const agentCRUDSchema = agentSchema.extend({
  _id: agentSchema.shape._id.optional()
});

const agentMongooseSchema = toMongooseSchema(agentZodMongooseSchema);
agentMongooseSchema.plugin(mongooseAutoPopulate);

type AgentDocument = InstanceType<typeof Agent> & {
  user: UserDocument;
};

type AgentDocumentType = z.infer<typeof agentZodMongooseSchema>;

const Agent = models?.Agent
  ? (models.Agent as Model<AgentDocumentType>)
  : mongoose.model<AgentDocumentType>('Agent', agentMongooseSchema);

export type { AgentDocument, AgentDocumentType };

export { Agent, agentCRUDSchema, agentSchema };

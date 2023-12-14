import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';

import type { UserDocumentType } from './user';

const { models } = pkg;

const agentZodSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId')
      .default(() => new mongoose.Types.ObjectId())
      .mongooseTypeOptions({ _id: true })
      .optional(),
    user: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      autopopulate: true,
      ref: 'User',
      required: true
    }),
    defaultCommissionRate: z.number().min(0).max(100).default(0)
  })
  .merge(genTimestampsSchema('createdAt', 'updatedAt'))
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'agents'
    }
  });

const agentSchema = toMongooseSchema(agentZodSchema);

agentSchema.plugin(mongooseAutoPopulate);

export type AgentDocument = InstanceType<typeof Agent> & {
  user: UserDocumentType;
};

export type AgentDocumentType = z.infer<typeof agentZodSchema>;

export const Agent = models?.Agent
  ? (models.Agent as Model<AgentDocumentType>)
  : mongoose.model<AgentDocumentType>('Agent', agentSchema);

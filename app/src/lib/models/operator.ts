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

const operatorZodSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId')
      .default(() => new mongoose.Types.ObjectId())
      .mongooseTypeOptions({ _id: true })
      .optional(),
    user: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      autopopulate: true,
      ref: 'User',
      required: true
    })
  })
  .merge(genTimestampsSchema('createdAt', 'updatedAt'))
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'operators'
    }
  });

const operatorSchema = toMongooseSchema(operatorZodSchema);

operatorSchema.plugin(mongooseAutoPopulate);

export type OperatorDocument = InstanceType<typeof Operator> & {
  user: UserDocumentType;
};

export type OperatorDocumentType = z.infer<typeof operatorZodSchema>;

export const Operator = models?.Operator
  ? (models.Operator as Model<OperatorDocumentType>)
  : mongoose.model<OperatorDocumentType>('Operator', operatorSchema);

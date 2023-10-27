import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';

import type { UserDocumentType } from './user';

const { Schema, models } = pkg;
const operatorSchema = new Schema(
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

operatorSchema.plugin(mongooseAutoPopulate);

export type OperatorDocument = InstanceType<typeof Operator>;

export type OperatorDocumentType = InferSchemaType<typeof operatorSchema> & {
  user: UserDocumentType;
};

export const Operator = models?.Operator
  ? (models.Operator as Model<OperatorDocumentType>)
  : mongoose.model<OperatorDocumentType>('Operator', operatorSchema);

import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';

import { userSchema } from '$lib/models/common';

const { Schema, models } = pkg;
const OperatorSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },

    user: {
      type: userSchema,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

export const Operator = models?.Operator
  ? (models.Operator as Model<OperatorDocumentType>)
  : mongoose.model<OperatorDocumentType>('Operator', OperatorSchema);

export type OperatorDocumentType = InferSchemaType<typeof OperatorSchema>;

export type OperatorType = InstanceType<typeof Operator>;

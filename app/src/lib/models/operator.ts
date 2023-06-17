import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import validator from 'validator';

const { Schema, models } = pkg;
const OperatorSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },

    address: {
      type: String,
      required: true,
      maxLength: 50,
      unique: true,
      index: true,
      validator: (v: string) => validator.isEthereumAddress(v),
    },

    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Operator = models?.Operator
  ? (models.Operator as Model<OperatorDocumentType>)
  : mongoose.model<OperatorDocumentType>('Operator', OperatorSchema);

export type OperatorDocumentType = InferSchemaType<typeof OperatorSchema>;

export type OperatorType = InstanceType<typeof Operator>;

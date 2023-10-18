import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import validator from 'validator';

const { Schema, models } = pkg;

const interestFormSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    interest: { type: String, required: true },
    email: {
      type: String,
      required: true,
      validator: (v: string) => validator.isEmail(v)
    }
  },
  { timestamps: true }
);

export type InterestFormDocumentType = InferSchemaType<
  typeof interestFormSchema
>;

export type InterestFormType = InstanceType<typeof InterestForm>;

export const InterestForm = models?.InterestForm
  ? (models?.InterestForm as Model<InterestFormDocumentType>)
  : mongoose.model<InterestFormDocumentType>(
      'InterestForm',
      interestFormSchema
    );

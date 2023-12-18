import type { Model } from 'mongoose';
import { default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  toZodMongooseSchema,
  z
} from 'mongoose-zod';
import validator from 'validator';

const { models } = pkg;

export type InterestFormDocumentType = z.infer<typeof interestFormZodSchema>;

export type InterestFormType = InstanceType<typeof InterestForm>;

const interestFormZodSchema = toZodMongooseSchema(
  z
    .object({
      _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
        _id: true,
        auto: true
      }),
      interest: z.string(),
      email: z.string().refine((value) => validator.isEmail(value), {
        message: 'Invalid email format'
      })
    })
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'interestforms'
    }
  }
);
const interestFormSchema = toMongooseSchema(interestFormZodSchema);

export const InterestForm = models?.InterestForm
  ? (models?.InterestForm as Model<InterestFormDocumentType>)
  : pkg.model<InterestFormDocumentType>('InterestForm', interestFormSchema);

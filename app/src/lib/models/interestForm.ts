import type { Model } from 'mongoose';
import { default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';
import validator from 'validator';

const { models } = pkg;

export type InterestFormDocumentType = z.infer<typeof interestFormZodSchema>;

export type InterestFormType = InstanceType<typeof InterestForm>;

const interestFormZodSchema = z
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
  .merge(genTimestampsSchema('createdAt', 'updatedAt'))
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'interestforms'
    }
  });

const interestFormSchema = toMongooseSchema(interestFormZodSchema);

export const InterestForm = models?.InterestForm
  ? (models?.InterestForm as Model<InterestFormDocumentType>)
  : pkg.model<InterestFormDocumentType>('InterestForm', interestFormSchema);

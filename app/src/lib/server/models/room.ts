import type { Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { z } from 'mongoose-zod';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  toZodMongooseSchema
} from 'mongoose-zod';

import { roomZodSchema } from '$lib/models/room';
const { models } = pkg;

const roomZodMongooseSchema = toZodMongooseSchema(
  roomZodSchema
    .merge(
      z.object({
        _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
          _id: true,
          auto: true,
          optional: true
        })
      })
    )
    .merge(genTimestampsSchema()),
  {
    schemaOptions: {
      collection: 'rooms'
    }
  }
);

const roomMongooseSchema = toMongooseSchema(roomZodMongooseSchema);
roomMongooseSchema.index({ uniqueUrl: 1 }, { unique: true });
roomMongooseSchema.index({ active: 1 });
// Define the Mongoose model for 'Room'
export type RoomDocument = InstanceType<typeof Room>;

type RoomDocumentType = z.infer<typeof roomZodMongooseSchema>;

// Define TypeScript types for the Room document
export const Room = models?.Room
  ? (models?.Room as Model<RoomDocumentType>)
  : mongoose.model<RoomDocumentType>('Room', roomMongooseSchema);

export { roomZodSchema } from '$lib/models/room';

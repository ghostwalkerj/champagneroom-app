import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import validator from 'validator';
const { Schema, models } = pkg;

export type UserDocument = InstanceType<typeof User>;

export type UserDocumentType = InferSchemaType<typeof userSchema>;
export enum AuthType {
  SIGNING = 'SIGNING',
  UNIQUE_KEY = 'UNIQUE KEY',
  PASSWORD = 'PASSWORD',
  NONE = 'NONE'
}

export { User };

export enum UserRole {
  OPERATOR = 'OPERATOR',
  PUBLIC = 'PUBLIC',
  AGENT = 'AGENT',
  CREATOR = 'CREATOR',
  EXTERNAL = 'EXTERNAL'
}

export const userSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true
    },

    address: {
      type: String,
      maxLength: 50,
      lowerCase: true,
      required: true,
      index: true,
      unique: true
    },

    roles: {
      type: [String],
      enum: UserRole,
      required: true
    },

    payoutAddress: {
      type: String,
      maxLength: 50,
      validator: (v: string) => validator.isEthereumAddress(v),
      lowerCase: true
    },

    nonce: {
      type: Number,
      default: () => Math.floor(Math.random() * 1_000_000)
    },

    name: {
      type: String,
      maxLength: 50,
      minLength: [3, 'Name is too short'],
      required: true,
      trim: true
    },

    authType: {
      type: String,
      enum: AuthType,
      required: true,
      default: AuthType.SIGNING
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

const User = models?.User
  ? (models.User as Model<UserDocumentType>)
  : mongoose.model<UserDocumentType>('User', userSchema);

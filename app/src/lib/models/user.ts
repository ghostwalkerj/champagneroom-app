import bcrypt from 'bcryptjs';
import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import { nanoid } from 'nanoid';
import validator from 'validator';

const { Schema, models } = pkg;

export type UserDocument = InstanceType<typeof User>;

export type UserDocumentType = InferSchemaType<typeof userSchema>;
export enum AuthType {
  SIGNING = 'SIGNING',
  PASSWORD_KEY = 'PASSWORD_KEY',
  PIN = 'PIN',
  NONE = 'NONE'
}

export { User };

export enum UserRole {
  OPERATOR = 'OPERATOR',
  PUBLIC = 'PUBLIC',
  AGENT = 'AGENT',
  CREATOR = 'CREATOR',
  EXTERNAL = 'EXTERNAL',
  TICKET_HOLDER = 'TICKET_HOLDER'
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

    secret: {
      type: String,
      maxLength: 50,
      minLength: [21, 'Secret is too short'],
      trim: true,
      default: () => nanoid(21),
      unique: true,
      index: true
    },

    password: {
      type: String,
      maxLength: 50,
      minLength: [8, 'Password is too short'],
      trim: true
    },

    name: {
      type: String,
      maxLength: 50,
      minLength: [3, 'Name is too short'],
      trim: true,
      required: true
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

userSchema.plugin(fieldEncryption, {
  fields: ['secret'],
  secret: process.env.MONGO_DB_FIELD_SECRET,
  saltGenerator: (secret: string) => secret.slice(0, 16)
});

userSchema.pre('save', function (next) {
  if (this.password && this.isModified('password')) {
    bcrypt.hash(this.password, 10, (error, hash) => {
      if (error) {
        next(error);
      }
      this.password = hash;
      next();
    });
  } else {
    next();
  }
});

userSchema.methods.comparePassword = function (password: string, salt: string) {
  const saltedPassword = `${password}${salt}`;
  return bcrypt.compare(saltedPassword, this.password);
};

const User = models?.User
  ? (models.User as Model<UserDocumentType>)
  : mongoose.model<UserDocumentType>('User', userSchema);

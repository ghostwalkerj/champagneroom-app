import bcrypt from 'bcryptjs';
import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { nanoid } from 'nanoid';
import validator from 'validator';

import Config from '$lib/config';
import { AuthType } from '$lib/constants';

const { Schema, models } = pkg;

export type UserDocument = InstanceType<typeof User>;

export type UserDocumentType = InferSchemaType<typeof userSchema> & {
  comparePassword: (password: string) => Promise<boolean>;
  isCreator: () => boolean;
  isAgent: () => boolean;
  isOperator: () => boolean;
};

export { User };

export enum UserRole {
  OPERATOR = 'OPERATOR',
  PUBLIC = 'PUBLIC',
  AGENT = 'AGENT',
  CREATOR = 'CREATOR',
  EXTERNAL = 'EXTERNAL',
  TICKET_HOLDER = 'TICKET HOLDER'
}

export const userSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      index: true,
      required: true
    },

    address: {
      type: String,
      maxLength: 50,
      lowerCase: true,
      index: true,
      unique: true,
      required: true,
      minLength: [21, 'Address is too short'],
      default: () => nanoid(21)
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
      default: () => nanoid(21),
      unique: true,
      index: true
    },

    password: {
      type: String,
      maxLength: 80,
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
    },

    profileImageUrl: {
      type: String,
      required: true,
      default: Config.UI.defaultProfileImage
    },

    referralCode: {
      type: String,
      maxLength: 50,
      minLength: [8, 'Referral code is too short'],
      trim: true,
      default: () => nanoid(10),
      index: true
    }
  },
  { timestamps: true }
);

// const saltGenerator = (secret: string) => secret.slice(0, 16);
// const hash = (secret) =>
//   crypto.createHash('sha256').update(secret).digest('hex').slice(0, 32);

// userSchema.plugin(fieldEncryption, {
//   fields: ['secret'],
//   secret: process.env.MONGO_DB_FIELD_SECRET,
//   saltGenerator
// });

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

userSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.isCreator = function () {
  return this.roles.includes(UserRole.CREATOR);
};

userSchema.methods.isAgent = function () {
  return this.roles.includes(UserRole.AGENT);
};

userSchema.methods.isOperator = function () {
  return this.roles.includes(UserRole.OPERATOR);
};

// userSchema.statics.encryptField = function (secret: string) {
//   return encrypt(
//     secret,
//     hash(process.env.MONGO_DB_FIELD_SECRET),
//     saltGenerator
//   );
// };

const User = models?.User
  ? (models.User as Model<UserDocumentType>)
  : mongoose.model<UserDocumentType>('User', userSchema);

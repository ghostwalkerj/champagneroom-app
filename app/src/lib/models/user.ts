import bcrypt from 'bcryptjs';
import type { Model, UpdateQuery } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import {
  genTimestampsSchema,
  mongooseZodCustomType,
  toMongooseSchema,
  z
} from 'mongoose-zod';
import { nanoid } from 'nanoid';
import validator from 'validator';

import Config from '$lib/config';
import { AuthType, UserRole } from '$lib/constants';
import { PermissionType } from '$lib/permissions';

const { models } = pkg;

export type UserDocument = InstanceType<typeof User> & {
  comparePassword: (password: string) => Promise<boolean>;
  isCreator: () => boolean;
  isAgent: () => boolean;
  isOperator: () => boolean;
  hasPermission: (permission: PermissionType) => boolean;
};

export type UserDocumentType = z.infer<typeof userZodSchema>;

export { User };

const userZodSchema = z
  .object({
    _id: mongooseZodCustomType('ObjectId').mongooseTypeOptions({
      _id: true,
      auto: true,
      get: (value) => value?.toString()
    }),
    wallet: mongooseZodCustomType('ObjectId')
      .optional()
      .mongooseTypeOptions({
        ref: 'Wallet',
        get: (value) => value?.toString()
      }),
    address: z
      .string()
      .toLowerCase()
      .trim()
      .refine((value) => validator.isEthereumAddress(value), {
        message: 'Invalid Ethereum address'
      })
      .optional()
      .mongooseTypeOptions({ index: true }),
    roles: z.array(z.nativeEnum(UserRole)),
    payoutAddress: z
      .string()
      .toLowerCase()
      .trim()
      .refine(
        (value) => validator.isEthereumAddress(value),
        'Invalid Ethereum address'
      )
      .optional(),
    nonce: z
      .number()
      .min(0)
      .default(() => Math.floor(Math.random() * 1_000_000)),
    secret: z
      .string()
      .max(50)
      .min(21, 'Secret is too short')
      .default(() => nanoid(21))
      .optional(),
    password: z
      .string()
      .max(80)
      .min(8, 'Password is too short')
      .trim()
      .optional(),
    name: z.string().max(50).min(3, 'Name is too short').trim(),
    authType: z.nativeEnum(AuthType).default(AuthType.SIGNING),
    active: z.boolean().default(true),
    profileImageUrl: z.string().default(Config.UI.defaultProfileImage),
    referralCode: z
      .string()
      .max(50)
      .min(8, 'Referral code is too short')
      .default(() => nanoid(10)),
    permissions: z.array(z.nativeEnum(PermissionType)).default([])
  })
  .merge(genTimestampsSchema())
  .strict()
  .mongoose({
    schemaOptions: {
      collection: 'users'
    }
  });

export const userSchema = toMongooseSchema(userZodSchema);
userSchema.index(
  { address: 1 },
  { unique: true, partialFilterExpression: { address: { $exists: true } } }
);

// const saltGenerator = (secret: string) => secret.slice(0, 16);
// const hash = (secret) =>
//   crypto.createHash('sha256').update(secret).digest('hex').slice(0, 32);

// userSchema.plugin(fieldEncryption, {
//   fields: ['secret'],
//   secret: process.env.MONGO_DB_FIELD_SECRET,
//   saltGenerator
// });

userSchema.pre('updateOne', async function (this: UpdateQuery<UserDocument>) {
  const update = { ...this.getUpdate() };
  // Only run this function if password was modified
  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
    this.setUpdate(update);
  }
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

userSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.isCreator = function (): boolean {
  return this.roles.includes(UserRole.CREATOR);
};

userSchema.methods.isAgent = function (): boolean {
  return this.roles.includes(UserRole.AGENT);
};

userSchema.methods.isOperator = function (): boolean {
  return this.roles.includes(UserRole.OPERATOR);
};

userSchema.methods.hasPermission = function (
  permission: PermissionType
): boolean {
  return this.permissions.includes(permission);
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

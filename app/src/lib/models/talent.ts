import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';
import { womensNames } from '$lib/util/womensNames';
import type { InferSchemaType, Model } from 'mongoose';
import mongoose, { Schema, models } from 'mongoose';
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator } from 'unique-names-generator';
import validator from 'validator';

const statSchema = new Schema(
  {
    ratingAvg: { type: Number, default: 0, min: 0, max: 5, required: true },
    totalEarnings: { type: Number, default: 0, min: 0, required: true },
    totalRating: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
      integer: true,
    },
    completedShows: [
      { type: Schema.Types.ObjectId, ref: 'Show', integer: true },
    ],
  },
  { timestamps: true }
);

const talentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    key: {
      type: String,
      required: true,
      maxLength: 30,
      minLength: 30,
      unique: true,
      default: function () {
        return nanoid(30);
      },
    },
    walletAddress: {
      type: String,
      maxLength: 50,
      validator: (v: string) => validator.isEthereumAddress(v),
    },
    name: {
      type: String,
      maxLength: 50,
      minLength: [4, 'Name is too short'],
      required: true,
      trim: true,
      startcase: true,
      default: function () {
        return uniqueNamesGenerator({
          dictionaries: [womensNames],
        });
      },
    },
    profileImageUrl: {
      type: String,
      default: PUBLIC_DEFAULT_PROFILE_IMAGE,
      required: true,
    },
    agentCommission: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      required: true,
      integer: true,
    },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    activeShows: [{ type: Schema.Types.ObjectId, ref: 'Show' }],
    stats: { type: statSchema, required: true, default: () => ({}) },
  },
  { timestamps: true }
);

export type TalentDocType = InferSchemaType<typeof talentSchema>;

export const Talent = models.Talent
  ? (models.Talent as Model<TalentDocType>)
  : (mongoose.model<TalentDocType>(
      'Talent',
      talentSchema
    ) as Model<TalentDocType>);

export type TalentType = InstanceType<typeof Talent>;

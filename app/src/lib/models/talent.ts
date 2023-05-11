import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';
import { womensNames } from '$lib/util/womensNames';
import type { InferSchemaType, Model } from 'mongoose';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator } from 'unique-names-generator';
import validator from 'validator';
import pkg from 'mongoose';

const { Schema, models } = pkg;

const statSchema = new Schema(
  {
    ratingAvg: { type: Number, default: 0, min: 0, max: 5, required: true },
    totalEarnings: { type: Number, default: 0, min: 0, required: true },
    totalRating: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    numRatings: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    numCompletedShows: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    completedShows: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Show',
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value',
        },
      },
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
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    activeShows: [{ type: Schema.Types.ObjectId, ref: 'Show' }],
    stats: { type: statSchema, required: true, default: () => ({}) },
  },
  { timestamps: true }
);

export type TalentDocType = InferSchemaType<typeof talentSchema>;

export const Talent = models?.Talent
  ? (models?.Talent as Model<TalentDocType>)
  : (mongoose.model<TalentDocType>(
      'Talent',
      talentSchema
    ) as Model<TalentDocType>);

export type TalentType = InstanceType<typeof Talent>;

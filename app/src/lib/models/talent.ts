import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { nanoid } from 'nanoid';
import validator from 'validator';

const { Schema, models } = pkg;

const feedbackSchema = new Schema({
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    required: true,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
  },
});

const salesSchema = new Schema({
  totalSales: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
  },
  numberOfShows: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
  },
  totalRefunds: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
  },
});

const talentSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
    },
    profileImageUrl: {
      type: String,
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
    feedbackStats: {
      type: feedbackSchema,
      required: true,
      default: () => ({}),
    },
    salesStats: { type: salesSchema, required: true, default: () => ({}) },
  },
  { timestamps: true }
);

export type TalentDocumentType = InferSchemaType<typeof talentSchema>;

export const Talent = models?.Talent
  ? (models?.Talent as Model<TalentDocumentType>)
  : mongoose.model<TalentDocumentType>('Talent', talentSchema);

export type TalentType = InstanceType<typeof Talent>;

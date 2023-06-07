import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';

const { Schema, models } = pkg;

const talentStatsSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent', required: true },
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
    numberOfReviews: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    totalCompletedShows: {
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

export type TalentStatsDocumentType = InferSchemaType<typeof talentStatsSchema>;

export const TalentStats = models?.Talent
  ? (models?.Talent as Model<TalentStatsDocumentType>)
  : mongoose.model<TalentStatsDocumentType>('TalentStats', talentStatsSchema);

export type TalentStatsType = InstanceType<typeof TalentStats>;

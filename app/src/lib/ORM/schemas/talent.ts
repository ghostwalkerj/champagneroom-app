import mongoose, { Schema } from 'mongoose';
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator } from 'unique-names-generator';
import { womensNames } from '$lib/util/womensNames';
import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';

const talentSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  key: {
    type: String,
    required: true,
    maxLength: 30,
    default: nanoid(),
    unique: true,
  },
  walletAddress: { type: String, maxLength: 50 },
  name: {
    type: String,
    maxLength: 50,
    minLength: [4, 'Name is too short'],
    required: true,
    trim: true,
    default: uniqueNamesGenerator({
      dictionaries: [womensNames],
    }),
  },
  profileImageUrl: { type: String, default: PUBLIC_DEFAULT_PROFILE_IMAGE },
  agentCommission: { type: Number, default: 0, min: 0, max: 100 },
  agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  currentShow: { type: Schema.Types.ObjectId, ref: 'Show' },
});

export const Talent = mongoose.model('Talent', talentSchema);

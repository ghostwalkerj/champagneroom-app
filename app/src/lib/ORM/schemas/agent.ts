import mongoose, { Schema } from 'mongoose';

const agentSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  address: {
    type: String,
    required: true,
    maxLength: 50,
    unique: true,
    index: true,
  },
});

export const Agent =
  mongoose.models.Agent || mongoose.model('Agent', agentSchema);

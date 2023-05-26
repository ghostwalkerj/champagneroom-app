import { womensNames } from '../util/womensNames';
import { default as mongoose, default as pkg } from 'mongoose';
import { uniqueNamesGenerator } from 'unique-names-generator';
import validator from 'validator';
const { Schema, models } = pkg;
const agentSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    walletAddress: {
        type: String,
        maxLength: 50,
        validator: (v) => validator.isEthereumAddress(v),
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
    address: {
        type: String,
        required: true,
        maxLength: 50,
        unique: true,
        index: true,
        validator: (v) => validator.isEthereumAddress(v),
    },
}, { timestamps: true });
export const Agent = models?.Agent
    ? models.Agent
    : mongoose.model('Agent', agentSchema);

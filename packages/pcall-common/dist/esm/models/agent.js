import mongoose, { models } from "mongoose";
import { uniqueNamesGenerator } from "unique-names-generator";
import validator from "validator";
import { womensNames } from "../util/womensNames.js";
import pkg from "mongoose";
const { Schema } = pkg;
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
        minLength: [4, "Name is too short"],
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
const Agent = models?.Agent
    ? models.Agent
    : mongoose.model("Agent", agentSchema);
export { Agent };

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Talent = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const nanoid_1 = require("nanoid");
const unique_names_generator_1 = require("unique-names-generator");
const validator_1 = __importDefault(require("validator"));
const constants_1 = require("../util/constants");
const womensNames_1 = require("../util/womensNames");
const mongoose_2 = __importDefault(require("mongoose"));
const { Schema, models } = mongoose_2.default;
const statSchema = new Schema({
    ratingAvg: { type: Number, default: 0, min: 0, max: 5, required: true },
    totalEarnings: { type: Number, default: 0, min: 0, required: true },
    totalRating: {
        type: Number,
        default: 0,
        min: 0,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    numReviews: {
        type: Number,
        default: 0,
        min: 0,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    numCompletedShows: {
        type: Number,
        default: 0,
        min: 0,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    completedShows: [
        {
            type: Schema.Types.ObjectId,
            ref: "Show",
            validate: {
                validator: Number.isInteger,
                message: "{VALUE} is not an integer value",
            },
        },
    ],
}, { timestamps: true });
const talentSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    key: {
        type: String,
        required: true,
        maxLength: 30,
        minLength: 30,
        unique: true,
        default: function () {
            return (0, nanoid_1.nanoid)(30);
        },
    },
    walletAddress: {
        type: String,
        maxLength: 50,
        validator: (v) => validator_1.default.isEthereumAddress(v),
    },
    name: {
        type: String,
        maxLength: 50,
        minLength: [4, "Name is too short"],
        required: true,
        trim: true,
        default: function () {
            return (0, unique_names_generator_1.uniqueNamesGenerator)({
                dictionaries: [womensNames_1.womensNames],
            });
        },
    },
    profileImageUrl: {
        type: String,
        default: constants_1.PUBLIC_DEFAULT_PROFILE_IMAGE,
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
            message: "{VALUE} is not an integer value",
        },
    },
    agent: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
    activeShows: [{ type: Schema.Types.ObjectId, ref: "Show" }],
    stats: { type: statSchema, required: true, default: () => ({}) },
}, { timestamps: true });
exports.Talent = models?.Talent
    ? models?.Talent
    : mongoose_1.default.model("Talent", talentSchema);

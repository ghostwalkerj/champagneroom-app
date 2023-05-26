"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const unique_names_generator_1 = require("unique-names-generator");
const validator_1 = __importDefault(require("validator"));
const womensNames_js_1 = require("../util/womensNames.js");
const mongoose_2 = __importDefault(require("mongoose"));
const { Schema } = mongoose_2.default;
const agentSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
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
                dictionaries: [womensNames_js_1.womensNames],
            });
        },
    },
    address: {
        type: String,
        required: true,
        maxLength: 50,
        unique: true,
        index: true,
        validator: (v) => validator_1.default.isEthereumAddress(v),
    },
}, { timestamps: true });
const Agent = mongoose_1.models?.Agent
    ? mongoose_1.models.Agent
    : mongoose_1.default.model("Agent", agentSchema);
exports.Agent = Agent;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowEvent = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = __importDefault(require("mongoose"));
const { Schema, models } = mongoose_2.default;
const showeventSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    type: { type: String, required: true },
    show: { type: Schema.Types.ObjectId, ref: "Show", required: true },
    talent: { type: Schema.Types.ObjectId, ref: "Talent", required: true },
    agent: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket" },
    transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
    ticketInfo: {
        type: {
            name: { type: String },
            price: { type: Number },
        },
        required: true,
    },
}, { timestamps: true });
showeventSchema.index({ createdAt: -1 });
exports.ShowEvent = (models?.ShowEvent
    ? models?.ShowEvent
    : mongoose_1.default.model("ShowEvent", showeventSchema));

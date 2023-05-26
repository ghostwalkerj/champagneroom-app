"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.TransactionReasonType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const mongoose_2 = __importDefault(require("mongoose"));
const { Schema, models } = mongoose_2.default;
var TransactionReasonType;
(function (TransactionReasonType) {
    TransactionReasonType["TICKET_PAYMENT"] = "TICKET PAYMENT";
    TransactionReasonType["TICKET_REFUND"] = "TICKET REFUND";
    TransactionReasonType["DISPUTE_RESOLUTION"] = "DISPUTE RESOLUTION";
})(TransactionReasonType = exports.TransactionReasonType || (exports.TransactionReasonType = {}));
const transactionSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    hash: { type: String },
    block: { type: Number },
    from: { type: String },
    to: { type: String },
    reason: { type: String, enum: TransactionReasonType },
    value: {
        type: String,
        required: true,
        validator: (v) => validator_1.default.isNumeric(v),
    },
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket" },
    talent: { type: Schema.Types.ObjectId, ref: "Talent" },
    agent: { type: Schema.Types.ObjectId, ref: "Agent" },
    show: { type: Schema.Types.ObjectId, ref: "Show" },
}, { timestamps: true });
exports.Transaction = models?.Transaction
    ? models?.Transaction
    : mongoose_1.default.model("Transaction", transactionSchema);

import mongoose from "mongoose";
import validator from "validator";
import pkg from "mongoose";
const { Schema, models } = pkg;
export var TransactionReasonType;
(function (TransactionReasonType) {
    TransactionReasonType["TICKET_PAYMENT"] = "TICKET PAYMENT";
    TransactionReasonType["TICKET_REFUND"] = "TICKET REFUND";
    TransactionReasonType["DISPUTE_RESOLUTION"] = "DISPUTE RESOLUTION";
})(TransactionReasonType || (TransactionReasonType = {}));
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
        validator: (v) => validator.isNumeric(v),
    },
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket" },
    talent: { type: Schema.Types.ObjectId, ref: "Talent" },
    agent: { type: Schema.Types.ObjectId, ref: "Agent" },
    show: { type: Schema.Types.ObjectId, ref: "Show" },
}, { timestamps: true });
export const Transaction = models?.Transaction
    ? models?.Transaction
    : mongoose.model("Transaction", transactionSchema);

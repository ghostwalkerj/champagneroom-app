"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = exports.ticketSchema = exports.TicketDisputeReason = exports.TicketDisputeDecision = exports.TicketCancelReason = exports.TicketStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../util/constants");
const validator_1 = __importDefault(require("validator"));
const mongoose_2 = __importDefault(require("mongoose"));
const { Schema, models } = mongoose_2.default;
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["RESERVED"] = "RESERVED";
    TicketStatus["CANCELLATION_INITIATED"] = "CANCELLATION INITIATED";
    TicketStatus["CANCELLED"] = "CANCELLED";
    TicketStatus["FINALIZED"] = "FINALIZED";
    TicketStatus["REDEEMED"] = "REDEEMED";
    TicketStatus["IN_ESCROW"] = "IN ESCROW";
    TicketStatus["IN_DISPUTE"] = "IN DISPUTE";
    TicketStatus["REFUNDED"] = "REFUNDED";
    TicketStatus["MISSED_SHOW"] = "MISSED SHOW";
    TicketStatus["SHOW_CANCELLED"] = "SHOW CANCELLED";
})(TicketStatus = exports.TicketStatus || (exports.TicketStatus = {}));
var TicketCancelReason;
(function (TicketCancelReason) {
    TicketCancelReason["SHOW_CANCELLED"] = "SHOW CANCELLED";
    TicketCancelReason["TALENT_NO_SHOW"] = "TALENT NO SHOW";
    TicketCancelReason["CUSTOMER_NO_SHOW"] = "CUSTOMER NO SHOW";
    TicketCancelReason["SHOW_RESCHEDULED"] = "SHOW RESCHEDULED";
    TicketCancelReason["CUSTOMER_CANCELLED"] = "CUSTOMER CANCELLED";
})(TicketCancelReason = exports.TicketCancelReason || (exports.TicketCancelReason = {}));
var TicketDisputeDecision;
(function (TicketDisputeDecision) {
    TicketDisputeDecision["TALENT_WON"] = "TALENT WON";
    TicketDisputeDecision["CUSTOMER_WON"] = "CUSTOMER WON";
    TicketDisputeDecision["SPLIT"] = "SPLIT";
})(TicketDisputeDecision = exports.TicketDisputeDecision || (exports.TicketDisputeDecision = {}));
var TicketDisputeReason;
(function (TicketDisputeReason) {
    TicketDisputeReason["ATTEMPTED_SCAM"] = "ATTEMPTED SCAM";
    TicketDisputeReason["ENDED_EARLY"] = "ENDED EARLY";
    TicketDisputeReason["LOW_QUALITY"] = "LOW QUALITY";
    TicketDisputeReason["TALENT_NO_SHOW"] = "TALENT NO SHOW";
    TicketDisputeReason["SHOW_NEVER_STARTED"] = "SHOW NEVER STARTED";
})(TicketDisputeReason = exports.TicketDisputeReason || (exports.TicketDisputeReason = {}));
const cancelSchema = new Schema({
    cancelledAt: { type: Date, required: true, default: Date.now },
    cancelledBy: { type: String, enum: constants_1.ActorType, required: true },
    reason: { type: String, enum: TicketCancelReason, required: true },
    cancelledInState: { type: String, enum: TicketStatus },
});
const redemptionSchema = new Schema({
    redeemedAt: { type: Date, required: true, default: Date.now },
});
const reservationSchema = new Schema({
    reservedAt: { type: Date, required: true, default: Date.now },
    name: { type: String, required: true },
    pin: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 8,
        validator: (v) => validator_1.default.isNumeric(v, { no_symbols: true }),
    },
});
// reservationSchema.plugin(fieldEncryption, {
//   fields: ["pin"],
//   secret: PUBLIC_MONGO_FIELD_SECRET,
// });
const escrowSchema = new Schema({
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
});
const disputeSchema = new Schema({
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    reason: { type: String, enum: TicketDisputeReason, required: true },
    disputedBy: { type: String, enum: constants_1.ActorType, required: true },
    explanation: { type: String, required: true },
    decision: { type: String, enum: TicketDisputeDecision },
});
const finalizeSchema = new Schema({
    finalizedAt: { type: Date, required: true, default: Date.now },
    finalizer: { type: String, enum: constants_1.ActorType, required: true },
});
const feedbackSchema = new Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    review: { type: String },
    createdAt: { type: Date, required: true, default: Date.now },
});
const refundSchema = new Schema({
    refundedAt: { type: Date, required: true, default: Date.now },
    transactions: [
        { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    ],
    amount: { type: Number, required: true, default: 0 },
});
const saleSchema = new Schema({
    soldAt: { type: Date, required: true, default: Date.now },
    transactions: [
        { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    ],
    amount: { type: Number, required: true, default: 0 },
});
const ticketStateSchema = new Schema({
    status: {
        type: String,
        enum: TicketStatus,
        required: true,
        default: TicketStatus.RESERVED,
    },
    active: { type: Boolean, required: true, default: true },
    totalPaid: { type: Number, required: true, default: 0 },
    totalRefunded: { type: Number, required: true, default: 0 },
    cancel: cancelSchema,
    redemption: redemptionSchema,
    reservation: reservationSchema,
    escrow: escrowSchema,
    dispute: disputeSchema,
    finalize: finalizeSchema,
    feedback: feedbackSchema,
    refund: refundSchema,
    sale: saleSchema,
}, { timestamps: true });
exports.ticketSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    paymentAddress: {
        type: String,
        maxLength: 50,
        required: true,
        validator: (v) => validator_1.default.isEthereumAddress(v),
    },
    price: { type: Number, required: true },
    show: { type: Schema.Types.ObjectId, ref: "Show" },
    ticketState: {
        type: ticketStateSchema,
        required: true,
        default: () => ({}),
    },
    agent: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
    talent: { type: Schema.Types.ObjectId, ref: "Talent", required: true },
    transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
}, { timestamps: true });
exports.Ticket = models?.Ticket
    ? models.Ticket
    : mongoose_1.default.model("Ticket", exports.ticketSchema);

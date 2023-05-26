"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Show = exports.ShowCancelReason = exports.ShowStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const constants_1 = require("../util/constants");
const { Schema, models } = mongoose_1.default;
var ShowStatus;
(function (ShowStatus) {
    ShowStatus["CREATED"] = "CREATED";
    ShowStatus["BOX_OFFICE_OPEN"] = "BOX OFFICE OPEN";
    ShowStatus["BOX_OFFICE_CLOSED"] = "BOX OFFICE CLOSED";
    ShowStatus["CANCELLED"] = "CANCELLED";
    ShowStatus["FINALIZED"] = "FINALIZED";
    ShowStatus["CANCELLATION_INITIATED"] = "CANCELLATION INITIATED";
    ShowStatus["REFUND_INITIATED"] = "REFUND INITIATED";
    ShowStatus["LIVE"] = "LIVE";
    ShowStatus["ENDED"] = "ENDED";
    ShowStatus["STOPPED"] = "STOPPED";
    ShowStatus["IN_ESCROW"] = "IN ESCROW";
})(ShowStatus = exports.ShowStatus || (exports.ShowStatus = {}));
var ShowCancelReason;
(function (ShowCancelReason) {
    ShowCancelReason["TALENT_NO_SHOW"] = "TALENT NO SHOW";
    ShowCancelReason["CUSTOMER_NO_SHOW"] = "CUSTOMER NO SHOW";
    ShowCancelReason["SHOW_RESCHEDULED"] = "SHOW RESCHEDULED";
    ShowCancelReason["TALENT_CANCELLED"] = "TALENT CANCELLED";
    ShowCancelReason["CUSTOMER_CANCELLED"] = "CUSTOMER CANCELLED";
})(ShowCancelReason = exports.ShowCancelReason || (exports.ShowCancelReason = {}));
const cancelSchema = new Schema({
    cancelledAt: { type: Date, required: true, default: Date.now },
    cancelledInState: { type: String },
    requestedBy: { type: String, enum: constants_1.ActorType, required: true },
    reason: { type: String, enum: ShowCancelReason, required: true },
});
const finalizeSchema = new Schema({
    finalizedAt: { type: Date, required: true, default: Date.now },
    finalizedBy: { type: String, enum: constants_1.ActorType, required: true },
});
const escrowSchema = new Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date },
});
const refundSchema = new Schema({
    refundedAt: { type: Date, required: true, default: Date.now },
    transactions: [
        { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    ],
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    requestedBy: { type: String, enum: constants_1.ActorType, required: true },
    amount: { type: Number, required: true, default: 0 },
});
const saleSchema = new Schema({
    soldAt: { type: Date, required: true, default: Date.now },
    transactions: [
        { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    ],
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    amount: { type: Number, required: true, default: 0 },
});
const runtimeSchema = new Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date },
});
const salesStatsSchema = new Schema({
    ticketsAvailable: {
        type: Number,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    ticketsSold: {
        type: Number,
        required: true,
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    ticketsReserved: {
        type: Number,
        required: true,
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    ticketsRefunded: {
        type: Number,
        required: true,
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    ticketsRedeemed: {
        type: Number,
        required: true,
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    totalSales: {
        type: Number,
        required: true,
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    totalRefunded: {
        type: Number,
        required: true,
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
});
const showStateSchema = new Schema({
    status: {
        type: String,
        enum: ShowStatus,
        required: true,
        default: ShowStatus.CREATED,
    },
    active: { type: Boolean, required: true, default: true },
    salesStats: {
        type: salesStatsSchema,
        required: true,
        default: () => ({}),
    },
    cancel: cancelSchema,
    finalize: finalizeSchema,
    escrow: escrowSchema,
    runtime: runtimeSchema,
    refunds: { type: [refundSchema], required: true, default: () => [] },
    sales: { type: [saleSchema], required: true, default: () => [] },
}, { timestamps: true });
const showSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    talent: { type: Schema.Types.ObjectId, ref: "Talent", required: true },
    agent: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
    roomId: {
        type: String,
        required: true,
        default: function () {
            return (0, uuid_1.v4)();
        },
        unique: true,
    },
    coverImageUrl: { type: String, trim: true },
    duration: {
        type: Number,
        required: true,
        min: [0, "Duration must be over 0"],
        max: [180, "Duration must be under 180 minutes"],
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: [3, "Name must be at least 3 characters"],
        maxLength: [50, "Name must be under 50 characters"],
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    price: { type: Number, required: true, min: 1 },
    talentInfo: {
        type: {
            name: { type: String, required: true },
            profileImageUrl: { type: String, required: true },
            ratingAvg: { type: Number, required: true, default: 0 },
            numReviews: { type: Number, required: true, default: 0 },
        },
        required: true,
    },
    showState: { type: showStateSchema, required: true, default: () => ({}) },
}, {
    timestamps: true,
});
exports.Show = models?.Show
    ? models.Show
    : mongoose_1.default.model("Show", showSchema);

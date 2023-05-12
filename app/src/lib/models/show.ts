import { PUBLIC_MONGO_FIELD_SECRET } from '$env/static/public';
import { ActorType } from '$lib/util/constants';
import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import { v4 as uuidv4 } from 'uuid';
import type { TicketDocType } from './ticket';
import type { TransactionDocType } from './transaction';

const { Schema, models } = pkg;
export enum ShowStatus {
  CREATED = 'CREATED',
  BOX_OFFICE_OPEN = 'BOX OFFICE OPEN',
  BOX_OFFICE_CLOSED = 'BOX OFFICE CLOSED',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  CANCELLATION_REQUESTED = 'CANCELLATION REQUESTED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  STOPPED = 'STOPPED',
  IN_ESCROW = 'IN ESCROW',
}

export enum ShowCancelReason {
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  TALENT_CANCELLED = 'TALENT CANCELLED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
}

const cancelSchema = new Schema({
  cancelledAt: { type: Date, required: true, default: Date.now },
  cancelledInState: { type: String, enum: ShowStatus },
  canceller: { type: String, enum: ActorType, required: true },
  reason: { type: String, enum: ShowCancelReason, required: true },
});

const finalizeSchema = new Schema({
  finalizedAt: { type: Date, required: true, default: Date.now },
  finalizer: { type: String, enum: ActorType, required: true },
});

const escrowSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date },
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
      message: '{VALUE} is not an integer value',
    },
  },
  ticketsSold: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  },
  ticketsReserved: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  },
  ticketsRefunded: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  },
  ticketsRedeemed: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  },
  totalSales: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  },
  totalRefunded: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  },
});

const showStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: ShowStatus,
      required: true,
      default: ShowStatus.CREATED,
    },
    salesStats: {
      type: salesStatsSchema,
      required: true,
      default: () => ({}),
    },
    cancel: {
      type: cancelSchema,
    },
    finalize: { type: finalizeSchema },
    escrow: {
      type: escrowSchema,
    },
    runtime: {
      type: runtimeSchema,
    },
    transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  },
  { timestamps: true }
);

const showSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    roomId: {
      type: String,
      required: true,
      default: function () {
        return uuidv4();
      },
      unique: true,
    },
    coverImageUrl: { type: String, trim: true },
    duration: {
      type: Number,
      required: true,
      min: [0, 'Duration must be over 0'],
      max: [180, 'Duration must be under 180 minutes'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: [3, 'Name must be at least 3 characters'],
      maxLength: [50, 'Name must be under 50 characters'],
    },
    numTickets: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    price: { type: Number, required: true, min: 1 },
    showState: { type: showStateSchema, required: true, default: () => ({}) },
  },
  {
    timestamps: true,
    methods: {
      saveState(newState) {
        mongoose
          .model('Show')
          .updateOne({ _id: this._id }, { $set: { showState: newState } })
          .exec();
      },
      createShowEvent({
        type,
        ticket,
        transaction,
      }: {
        type: string;
        ticket?: TicketDocType;
        transaction?: TransactionDocType;
      }) {
        mongoose.model('ShowEvent').create({
          show: this._id,
          type,
          ticket: ticket?._id,
          transaction: transaction?._id,
          agent: this.agent,
          talent: this.talent,
        });
      },
    },
  }
);

showSchema.plugin(fieldEncryption, {
  fields: ['roomId'],
  secret: PUBLIC_MONGO_FIELD_SECRET,
});

export type ShowStateType = InferSchemaType<typeof showStateSchema>;

export type ShowDocType = InferSchemaType<typeof showSchema>;

export const Show = models?.Show
  ? (models.Show as Model<ShowDocType>)
  : (mongoose.model<ShowDocType>('Show', showSchema) as Model<ShowDocType>);

export type ShowType = InstanceType<typeof Show>;

export const observeShow = async (
  show: ShowDocType,
  callback: (show: ShowDocType) => void,
  signal: AbortSignal
) => {
  while (show) {
    const response = await fetch('/api/v1/changesets/show/' + show._id, {
      signal,
    });
    const changeset = await response.json();
    callback(changeset);
  }
};

import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import { nanoid } from 'nanoid';

import type { refundSchema, saleSchema } from './common';
import { cancelSchema, escrowSchema, finalizeSchema } from './common';

const { Schema, models } = pkg;
export const SaveState = (show: ShowType, newState: ShowStateType) => {
  Show.updateOne({ _id: show._id }, { $set: { showState: newState } }).exec();
};

enum ShowStatus {
  CREATED = 'CREATED',
  BOX_OFFICE_OPEN = 'BOX OFFICE OPEN',
  BOX_OFFICE_CLOSED = 'BOX OFFICE CLOSED',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  CANCELLATION_INITIATED = 'CANCELLATION INITIATED',
  REFUND_INITIATED = 'REFUND INITIATED',
  LIVE = 'LIVE',
  STOPPED = 'STOPPED',
  IN_ESCROW = 'IN ESCROW',
  IN_DISPUTE = 'IN DISPUTE'
}

const runtimeSchema = new Schema({
  startDate: { type: Date, required: true, default: new Date() },
  endDate: { type: Date }
});

const disputeStatsSchema = new Schema({
  totalDisputes: {
    type: Number,
    required: true,
    default: 0
  },
  totalDisputesRefunded: {
    type: Number,
    required: true,
    default: 0
  },
  totalDisputesResolved: {
    type: Number,
    required: true,
    default: 0
  },
  totalDisputesPending: {
    type: Number,
    required: true,
    default: 0
  }
});

const salesStatsSchema = new Schema({
  ticketsAvailable: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  ticketsSold: {
    type: Number,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  ticketsReserved: {
    type: Number,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  ticketsRefunded: {
    type: Number,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },

  ticketsRedeemed: {
    type: Number,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  totalSales: {
    type: Number,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  totalRefunded: {
    type: Number,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  totalRevenue: {
    type: Number,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  }
});

const feedbackStatsSchema = new Schema({
  numberOfReviews: {
    type: Number,
    required: true,
    default: 0
  },
  averageRating: {
    type: Number,
    required: true,
    default: 0
  }
});

const showStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: ShowStatus,
      required: true,
      default: ShowStatus.CREATED
    },
    activeState: { type: Boolean, default: true, index: true },
    salesStats: {
      type: salesStatsSchema,
      required: true,
      default: () => ({})
    },
    feedbackStats: {
      type: feedbackStatsSchema,
      required: true,
      default: () => ({})
    },
    disputeStats: {
      type: disputeStatsSchema,
      required: true,
      default: () => ({})
    },
    cancel: cancelSchema,
    finalize: finalizeSchema,
    escrow: escrowSchema,
    runtime: runtimeSchema,
    refunds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Ticket.ticketState.refund'
        }
      ],
      required: true,
      default: () => []
    },
    sales: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Ticket.ticketState.sale'
        }
      ],
      required: true,
      default: () => []
    },
    disputes: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Ticket.ticketState.dispute'
        }
      ],
      required: true,
      default: () => []
    },
    reservations: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Ticket'
        }
      ],
      required: true,
      default: () => []
    },
    redemptions: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Ticket'
        }
      ],
      required: true,
      default: () => []
    },
    cancellations: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Ticket'
        }
      ],
      required: true,
      default: () => []
    },
    current: {
      type: Boolean,
      required: true,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

const showSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    talent: {
      type: Schema.Types.ObjectId,
      ref: 'Talent',
      required: true,
      index: true
    },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    roomId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid()
    },
    coverImageUrl: { type: String, trim: true },
    duration: {
      type: Number,
      required: true,
      min: [0, 'Duration must be over 0'],
      max: [180, 'Duration must be under 180 minutes'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: [3, 'Name must be at least 3 characters'],
      maxLength: [50, 'Name must be under 50 characters']
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },
    price: { type: Number, required: true, min: 1 },
    talentInfo: {
      type: {
        name: { type: String, required: true },
        profileImageUrl: { type: String, required: true },
        averageRating: { type: Number, required: true, default: 0 },
        numberOfReviews: { type: Number, required: true, default: 0 }
      },
      required: true
    },
    showState: { type: showStateSchema, required: true, default: () => ({}) }
  },
  { timestamps: true }
);

showSchema.plugin(fieldEncryption, {
  fields: ['roomId'],
  secret: process.env.MONGO_DB_FIELD_SECRET
});

export const Show = models?.Show
  ? (models.Show as Model<ShowDocumentType>)
  : mongoose.model<ShowDocumentType>('Show', showSchema);

export { ShowStatus };

export type ShowDocumentType = InferSchemaType<typeof showSchema>;

export type ShowRefundType = InferSchemaType<typeof refundSchema>;

export type ShowSaleType = InferSchemaType<typeof saleSchema>;

export type ShowStateType = InferSchemaType<typeof showStateSchema>;

export type ShowType = InstanceType<typeof Show>;

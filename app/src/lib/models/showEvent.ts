import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';

import type { ShowDocumentType } from './show';
import type { TicketDocumentType } from './ticket';
import type { TransactionDocumentType } from './transaction';

const { Schema, models } = pkg;
const showeventSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    type: { type: String, required: true },
    show: { type: Schema.Types.ObjectId, ref: 'Show', required: true },
    talent: { type: Schema.Types.ObjectId, ref: 'Talent', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    ticketInfo: {
      type: {
        name: { type: String },
        price: { type: Number }
      },
      required: true
    }
  },
  { timestamps: true }
);

showeventSchema.index({ createdAt: -1 });

export const ShowEvent = models?.ShowEvent
  ? (models.ShowEvent as Model<ShowEventDocumentType>)
  : mongoose.model<ShowEventDocumentType>('ShowEvent', showeventSchema);

export const createShowEvent = ({
  show,
  type,
  ticket,
  transaction
}: {
  show: ShowDocumentType;
  type: string;
  ticket?: TicketDocumentType;
  transaction?: TransactionDocumentType;
}) => {
  ShowEvent.create({
    show: show._id,
    type,
    ticket: ticket?._id,
    transaction: transaction?._id,
    agent: show.agent,
    talent: show.talent,
    ticketInfo: {
      name: ticket?.customerName,
      price: ticket?.price
    }
  });
};

export type ShowEventDocumentType = InferSchemaType<typeof showeventSchema>;

export type ShowEventType = InstanceType<typeof ShowEvent>;

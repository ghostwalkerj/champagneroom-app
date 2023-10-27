import type { InferSchemaType, Model } from 'mongoose';
import { default as mongoose, default as pkg } from 'mongoose';

import type { ShowDocumentType } from './show';
import type { TransactionDocumentType } from './transaction';

const { Schema, models } = pkg;
const showeventSchema = new Schema(
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: { type: Schema.Types.ObjectId, required: true, auto: true },
    type: { type: String, required: true },
    show: { type: Schema.Types.ObjectId, ref: 'Show', required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'Creator', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    ticketInfo: {
      type: {
        customerName: { type: String }
      }
    }
  },
  { timestamps: true }
);

showeventSchema.index({ createdAt: -1 });

export type ShowEventDocumentType = InferSchemaType<typeof showeventSchema>;

export type ShowEventDocument = InstanceType<typeof ShowEvent>;

export const ShowEvent = models?.ShowEvent
  ? (models.ShowEvent as Model<ShowEventDocumentType>)
  : mongoose.model<ShowEventDocumentType>('ShowEvent', showeventSchema);

export const createShowEvent = ({
  show,
  type,
  ticketId,
  transaction,
  ticketInfo
}: {
  show: ShowDocumentType;
  type: string;
  ticketId?: string;
  transaction?: TransactionDocumentType;
  ticketInfo?: { customerName: string };
}) => {
  ShowEvent.create({
    show: show._id,
    type,
    ticketId,
    transaction: transaction?._id,
    agent: show.agent,
    creator: show.creator,
    ticketInfo
  });
};

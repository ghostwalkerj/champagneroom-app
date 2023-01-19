import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxDocument,
  type RxJsonSchema,
} from 'rxdb';
import type { ShowDocument } from './show';
import type { TalentDocument } from './talent';
import type { TicketDocument } from './ticket';

export enum ShowEventType {
  STARTED,
  JOINED,
  LEFT,
  ENDED,
  REFUNDED,
  CANCELLED,
}

const ShowEventSchemaLiteral = {
  title: 'showEvent',
  description: 'showEvent for a show',
  version: 0,
  type: 'object',
  primaryKey: '_id',
  properties: {
    _id: {
      type: 'string',
      maxLength: 70,
    },
    entityType: {
      type: 'string',
      default: 'showEvent',
      maxLength: 20,
      final: true,
    },
    createdAt: { type: 'integer' },
    updatedAt: { type: 'integer' },
    endedAt: { type: 'integer' },
    _deleted: {
      type: 'boolean',
      default: false,
    },
    type: {
      type: 'string',
      enum: Object.values(ShowEventType),
    },
    show: {
      type: 'string',
      ref: 'shows',
      maxLength: 50,
    },
    talent: {
      type: 'string',
      ref: 'talents',
      maxLength: 50,
    },
    agent: {
      type: 'string',
      ref: 'agents',
      maxLength: 50,
    },
    ticket: {
      type: 'string',
      ref: 'tickets',
      maxLength: 50,
    },
  },
  required: ['_id', 'show', 'createdAt', 'type', 'talent', 'agent'],
} as const;

type ShowEventRef = {
  show_?: Promise<ShowDocument>;
  talent_?: Promise<TalentDocument>;
  ticket_?: Promise<TicketDocument>;
};

export const ShowEventString = 'showEvent';

const schemaTyped = toTypedRxJsonSchema(ShowEventSchemaLiteral);
export type ShowEventDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const showEventSchema: RxJsonSchema<ShowEventDocType> =
  ShowEventSchemaLiteral;
export type ShowEventDocument = RxDocument<ShowEventDocType> & ShowEventRef;
export type ShowEventCollection = RxCollection<ShowEventDocType>;

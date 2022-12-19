import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxDocument,
  type RxJsonSchema
} from 'rxdb';
import type { AgentDocument } from './agent';
import type { TalentDocument } from './talent';
import type { TicketDocument } from './ticket';

export enum ShowStatus {
  CREATED,
  BOX_OFFICE_OPEN,
  BOX_OFFICE_CLOSED,
  CANCELED,
  FINALIZED,
  IN_ESCROW,
  IN_DISPUTE,
  CANCELLATION_REQUESTED
}

const showSchemaLiteral = {
  title: 'show',
  description: 'single performance of a talent',
  version: 0,
  type: 'object',
  primaryKey: '_id',
  properties: {
    _id: {
      type: 'string',
      maxLength: 70
    },
    entityType: {
      type: 'string',
      default: 'show',
      maxLength: 20,
      final: true
    },
    createdAt: { type: 'integer' },
    updatedAt: {
      type: 'integer'
    },
    _deleted: {
      type: 'boolean',
      default: false
    },
    showState: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(ShowStatus),
          default: ShowStatus.CREATED
        }
      }
    },
    tickets: {
      type: 'array',
      ref: 'tickets',
      items: {
        type: 'string',
        maxLength: 50
      },
      default: []
    },
    talent: {
      type: 'string',
      ref: 'talents',
      maxLength: 50
    },
    agent: { type: 'string', ref: 'agents', maxLength: 70 },
    roomId: { type: 'string', maxLength: 50 },
    coverPhotoUrl: { type: 'string', maxLength: 100 },
    talentInfo: {
      type: 'object',
      properties: {
        profileImageUrl: {
          type: 'string'
        },
        name: {
          type: 'string',
          maxLength: 50
        },
        stats: {
          type: 'object',
          properties: {
            numCompletedShows: {
              type: 'integer',
              minimum: 0
            },
            ratingAvg: {
              type: 'number',
              minimum: 0,
              maximum: 5
            }
          },
          required: ['numCompletedShows', 'ratingAvg']
        }
      },
      required: ['profileImageUrl', 'name', 'stats']
    },
    duration: { type: 'integer' },
    price: { type: 'integer' },
    name: { type: 'string', maxLength: 50 },
    maxNumTickets: { type: 'integer' },
    salesStats: {
      type: 'object',
      properties: {
        ticketsSold: { type: 'integer', default: 0 },
        totalSales: { type: 'integer', default: 0 },
      },
      required: ['ticketsSold', 'totalSales']
    }
  },
  required: ['_id', 'createdAt', 'agent', 'talent', 'duration', 'price', 'name', 'maxNumTickets', 'roomId', 'salesStats'],
  encrypted: ['roomId']
} as const;

type showRef = {
  talent_?: Promise<TalentDocument>;
  agent_?: Promise<AgentDocument>;
  tickets_?: Promise<TicketDocument[]>;
};

export const ShowString = 'show';

const schemaTyped = toTypedRxJsonSchema(showSchemaLiteral);
export type ShowDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const showSchema: RxJsonSchema<ShowDocType> = showSchemaLiteral;
export type ShowDocument = RxDocument<ShowDocType> & showRef;
export type ShowCollection = RxCollection<ShowDocType>;

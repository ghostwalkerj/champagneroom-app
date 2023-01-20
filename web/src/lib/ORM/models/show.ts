import type { ShowStateCallbackType } from '$lib/machines/showMachine';
import { ActorType } from '$lib/util/constants';
import { nanoid } from 'nanoid';
import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxDocument,
  type RxJsonSchema,
} from 'rxdb';
import type { AgentDocument } from './agent';
import type { TalentDocument } from './talent';
import {
  TicketStatus,
  TicketString,
  type TicketDocType,
  type TicketDocument,
} from './ticket';

export enum ShowStatus {
  CREATED,
  BOX_OFFICE_OPEN,
  BOX_OFFICE_CLOSED,
  CANCELLED,
  FINALIZED,
  IN_ESCROW,
  IN_DISPUTE,
  CANCELLATION_REQUESTED,
  STARTED,
  ENDED,
}

export enum ShowCancelReason {
  TALENT_NO_SHOW,
  CUSTOMER_NO_SHOW,
  SHOW_RESCHEDULED,
  TALENT_CANCELLED,
  CUSTOMER_CANCELLED,
}

type ShowDocMethods = {
  saveShowStateCallback: ShowStateCallbackType;
  createTicket: (ticketProps: {
    name: string;
    pin: string;
  }) => Promise<TicketDocument>;
};
export const showDocMethods: ShowDocMethods = {
  saveShowStateCallback: async function (
    this: ShowDocument,
    _showState: ShowDocument['showState']
  ) {
    this.atomicPatch({
      showState: _showState,
    });
  },
  createTicket: async function (
    this: ShowDocument,
    ticketProps: { name: string; pin: string }
  ) {
    const db = this.collection.database;
    const _ticket = {
      _id: `${TicketString}:tk-${nanoid()}`,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      entityType: TicketString,
      paymentAddress: '0x0000000000000000000000000000000000000000', // TODO: generate payment address
      show: this._id,
      agent: this.agent,
      talent: this.talent,
      ticketState: {
        status: TicketStatus.RESERVED,
        updatedAt: new Date().getTime(),
        price: this.price,
        refundedAmount: 0,
        totalPaid: 0,
        reservation: {
          createdAt: new Date().getTime(),
          name: ticketProps.name,
          pin: ticketProps.pin,
        },
      },
    } as TicketDocType;
    const ticket = await db.tickets.insert(_ticket);
    return ticket;
  },
};

const showSchemaLiteral = {
  title: 'show',
  description: 'single performance of a talent',
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
      default: 'show',
      maxLength: 20,
      final: true,
    },
    createdAt: { type: 'integer' },
    updatedAt: {
      type: 'integer',
    },
    _deleted: {
      type: 'boolean',
      default: false,
    },
    showState: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(ShowStatus),
          default: ShowStatus.CREATED,
        },
        updatedAt: { type: 'integer' },
        ticketsAvailable: { type: 'integer' },
        ticketsReserved: { type: 'integer', default: 0 },
        ticketsSold: { type: 'integer', default: 0 },
        ticketsRefunded: { type: 'integer', default: 0 },
        totalSales: { type: 'integer', default: 0 },
        startDate: { type: 'integer' },
        endDate: { type: 'integer' },
        refundedAmount: {
          type: 'integer',
          default: 0,
          minimum: 0,
          maximum: 99999,
        },
        cancel: {
          type: 'object',
          properties: {
            createdAt: { type: 'integer' },
            cancelledInState: { type: 'string' },
            canceller: {
              type: 'string',
              enum: Object.values(ActorType),
            },
            reason: {
              type: 'string',
              enum: Object.values(ShowCancelReason),
            },
          },
          required: [
            'createdAt',
            'cancelledInState',
            'showCancelReason',
            'canceller',
          ],
        },
        finalized: {
          type: 'object',
          properties: {
            endedAt: { type: 'integer' },
          },
          required: ['endedAt'],
        },
        transactions: {
          type: 'array',
          ref: 'transactions',
          items: { type: 'string' },
        },
      },
      required: [
        'status',
        'updatedAt',
        'ticketsAvailable',
        'ticketsReserved',
        'ticketsRefunded',
        'ticketsSold',
        'totalSales',
        'refundedAmount',
      ],
    },
    talent: {
      type: 'string',
      ref: 'talents',
      maxLength: 50,
    },
    agent: { type: 'string', ref: 'agents', maxLength: 70 },
    roomId: { type: 'string', maxLength: 50 },
    coverPhotoUrl: { type: 'string', maxLength: 100 },
    talentInfo: {
      type: 'object',
      properties: {
        profileImageUrl: {
          type: 'string',
        },
        name: {
          type: 'string',
          maxLength: 50,
        },
        stats: {
          type: 'object',
          properties: {
            numCompletedShows: {
              type: 'integer',
              minimum: 0,
            },
            ratingAvg: {
              type: 'number',
              minimum: 0,
              maximum: 5,
            },
          },
          required: ['numCompletedShows', 'ratingAvg'],
        },
      },
      required: ['profileImageUrl', 'name', 'stats'],
    },
    duration: { type: 'integer' },
    price: { type: 'integer' },
    name: { type: 'string', maxLength: 50 },
    maxNumTickets: { type: 'integer' },
  },
  required: [
    '_id',
    'createdAt',
    'agent',
    'talent',
    'duration',
    'price',
    'name',
    'maxNumTickets',
    'roomId',
    'showState',
    'talentInfo',
  ],
  encrypted: ['roomId'],
} as const;

type showRef = {
  talent_?: Promise<TalentDocument>;
  agent_?: Promise<AgentDocument>;
};

export const ShowString = 'show';

const schemaTyped = toTypedRxJsonSchema(showSchemaLiteral);
export type ShowDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const showSchema: RxJsonSchema<ShowDocType> = showSchemaLiteral;
export type ShowDocument = RxDocument<ShowDocType, ShowDocMethods> & showRef;
export type ShowCollection = RxCollection<ShowDocType, ShowDocMethods>;

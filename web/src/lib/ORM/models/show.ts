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
import type { ShowEventDocument, ShowEventType } from './showevent';
import { ShowEventString } from './showevent';
import type { TalentDocument } from './talent';
import {
  TicketStatus,
  TicketString,
  type TicketDocType,
  type TicketDocument,
} from './ticket';
import type { TransactionDocType } from './transaction';

export enum ShowStatus {
  CREATED = 'CREATED',
  BOX_OFFICE_OPEN = 'BOX OFFICE OPEN',
  BOX_OFFICE_CLOSED = 'BOX OFFICE CLOSED',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  IN_ESCROW = 'IN ESCROW',
  IN_DISPUTE = 'IN DISPUTE',
  CANCELLATION_REQUESTED = 'CANCELLATION REQUESTED',
  STARTED = 'STARTED',
  ENDED = 'ENDED',
}

export enum ShowCancelReason {
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  TALENT_CANCELLED = 'TALENT CANCELLED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
}

type ShowDocMethods = {
  saveShowStateCallback: ShowStateCallbackType;
  createTicket: (ticketProps: {
    name: string;
    pin: string;
  }) => Promise<TicketDocument>;
  createShowevent: (showeventProps: {
    type: ShowEventType;
    ticket?: TicketDocType;
    transaction?: TransactionDocType;
  }) => Promise<ShowEventDocument>;
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
        active: true,
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
  createShowevent: async function (
    this: ShowDocument,
    showeventProps: {
      type: ShowEventType;
      ticket?: TicketDocType;
      transaction?: TransactionDocType;
    }
  ) {
    const db = this.collection.database;
    let ticketId: string | undefined = undefined;
    let name: string | undefined = undefined;
    const transactionId = showeventProps.transaction?._id || undefined;
    if (showeventProps.ticket) {
      ticketId = showeventProps.ticket._id;
      name = showeventProps.ticket.ticketState.reservation.name;
    }
    const _showevent = {
      _id: `showevent:se-${nanoid()}`,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      entityType: ShowEventString,
      type: showeventProps.type,
      show: this._id,
      talent: this.talent,
      agent: this.agent,
      ticket: ticketId,
      ticketInfo: {
        name,
      },
      transaction: transactionId,
    };
    const showevent = await db.showevents.insert(_showevent);
    return showevent;
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
    createdAt: {
      type: 'integer',
      minimum: 0,
      maximum: 9999999999999,
      final: true,
    },
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
        },
        active: {
          type: 'boolean',
        },
        updatedAt: { type: 'integer' },
        ticketsAvailable: { type: 'integer' },
        ticketsReserved: { type: 'integer' },
        ticketsSold: { type: 'integer' },
        ticketsRefunded: { type: 'integer' },
        totalSales: { type: 'integer' },
        startDate: { type: 'integer' },
        endDate: { type: 'integer' },
        refundedAmount: {
          type: 'integer',
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
        'active',
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
  indexes: [['agent', 'entityType'], ['entityType']],
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

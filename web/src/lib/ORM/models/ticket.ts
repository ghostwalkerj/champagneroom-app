import type { AgentDocument } from '$lib/ORM/models/agent';

import type { TalentDocument } from '$lib/ORM/models/talent';
import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxDocument,
  type RxJsonSchema,
} from 'rxdb';

import { ActorType } from '$lib/util/constants';
import { nanoid } from 'nanoid';
import type { ShowDocument } from './show';
import {
  type TransactionReasonType,
  TransactionString,
  type TransactionDocument,
} from './transaction';
import type { TicketStateCallbackType } from '$lib/machines/ticketMachine';

export enum TicketStatus {
  RESERVED,
  CANCELLATION_REQUESTED,
  CANCELLED,
  FINALIZED,
  IN_ESCROW,
  IN_DISPUTE,
  REFUNDED,
}

export enum TicketCancelReason {
  SHOW_CANCELLED,
  TALENT_NO_SHOW,
  CUSTOMER_NO_SHOW,
  SHOW_RESCHEDULED,
  CUSTOMER_CANCELLED,
}

export enum DisputeDecision {
  TALENT_WON,
  CUSTOMER_WON,
  SPLIT,
}

type TicketDocMethods = {
  saveTicketStateCallback: TicketStateCallbackType;
  createTransaction: (transactionProps: {
    hash: string;
    block: number;
    from: string;
    to: string;
    value: string;
    reason: TransactionReasonType;
  }) => Promise<TransactionDocument>;
};

export const ticketDocMethods: TicketDocMethods = {
  saveTicketStateCallback: async function (
    this: TicketDocument,
    _ticketState: TicketDocument['ticketState']
  ) {
    this.atomicPatch({
      ticketState: _ticketState,
    });
  },
  createTransaction: async function (
    this: TicketDocument,
    transactionProps: {
      hash: string;
      block: number;
      from: string;
      to: string;
      value: string;
      reason: TransactionReasonType;
    }
  ) {
    const db = this.collection.database;
    const transaction = await db.transactions.insert({
      _id: `${TransactionString}:tr-${nanoid()}`,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      talent: this.talent,
      ticket: this._id,
      agent: this.agent,
      ...transactionProps,
    });
    return transaction;
  },
};

export const TicketString = 'ticket';
const ticketSchemaLiteral = {
  title: 'ticket',
  description: 'onetime ticket to a show',
  version: 0,
  type: 'object',
  primaryKey: '_id',
  properties: {
    _id: {
      type: 'string',
      maxLength: 50,
    },
    entityType: {
      type: 'string',
      default: 'ticket',
      maxLength: 20,
      final: true,
    },
    paymentAddress: {
      type: 'string',
      maxLength: 50,
    },
    ticketState: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(TicketStatus),
          default: TicketStatus.RESERVED,
        },
        price: {
          type: 'integer',
          default: 0,
          minimum: 0,
          maximum: 99999,
        },
        totalPaid: {
          type: 'integer',
          default: 0,
          minimum: 0,
          maximum: 99999,
        },
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
            canceller: {
              type: 'string',
              enum: Object.values(ActorType),
            },
            cancelledInState: { type: 'string' },
            reason: {
              type: 'string',
              enum: Object.values(TicketCancelReason),
            },
          },
          required: ['createdAt', 'canceller', 'cancelledInState', 'reason'],
        },
        reservation: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            pin: { type: 'string' },
            createdAt: { type: 'integer' },
          },
          required: ['name', 'pin', 'createdAt'],
        },
        escrow: {
          type: 'object',
          properties: {
            startedAt: { type: 'integer' },
            endedAt: { type: 'integer' },
          },
          required: ['startedAt'],
        },
        dispute: {
          type: 'object',
          properties: {
            startedAt: { type: 'integer' },
            endedAt: { type: 'integer' },
            disputer: {
              type: 'string',
              enum: Object.values(ActorType),
            },
            outcome: {
              type: 'object',
              properties: {
                decision: {
                  type: 'string',
                  enum: Object.values(DisputeDecision),
                },
              },
              required: ['decision'],
            },
          },
          required: ['startedAt', 'disputer'],
        },
        finalized: {
          type: 'object',
          properties: {
            endedAt: { type: 'integer' },
          },
          required: ['endedAt'],
        },
        feedback: {
          type: 'object',
          properties: {
            rating: {
              type: 'integer',
              default: 0,
              minimum: 0,
              maximum: 5,
            },
            comment: {
              type: 'string',
              maxLength: 500,
            },
            createdAt: { type: 'integer' },
          },
          required: ['createdAt', 'rating'],
        },
        ticketEvents: {
          type: 'array',
          ref: 'ticketEvents',
          items: { type: 'string' },
        },
        transactions: {
          type: 'array',
          ref: 'transactions',
          items: { type: 'string' },
        },
        updatedAt: { type: 'integer' },
      },
      required: [
        'status',
        'updatedAt',
        'price',
        'refundedAmount',
        'totalPaid',
        'reservation',
      ],
    },
    talent: { type: 'string', ref: 'talents', maxLength: 50 },
    agent: { type: 'string', ref: 'agents', maxLength: 70 },
    show: { type: 'string', ref: 'shows', maxLength: 50 },
    createdAt: {
      type: 'integer',
    },
    updatedAt: {
      type: 'integer',
    },
    _deleted: {
      type: 'boolean',
      default: false,
    },
  },
  encrypted: ['ticketState.reservation.pin'],
  required: [
    '_id',
    'talent',
    'agent',
    'show',
    'paymentAddress',
    'ticketState',
    'createdAt',
  ],
  indexes: ['show'],
} as const;

type ticketRef = {
  talent_?: Promise<TalentDocument>;
  agent_?: Promise<AgentDocument>;
  show_?: Promise<ShowDocument>;
};

const schemaTyped = toTypedRxJsonSchema(ticketSchemaLiteral);
export type TicketDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const ticketSchema: RxJsonSchema<TicketDocType> = ticketSchemaLiteral;
export type TicketDocument = RxDocument<TicketDocType, TicketDocMethods> &
  ticketRef;
export type TicketCollection = RxCollection<TicketDocType, TicketDocMethods>;

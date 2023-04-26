import type { AgentDocument } from '$lib/ORM/models/agent';

import type { TalentDocument } from '$lib/ORM/models/talent';
import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxDocument,
  type RxJsonSchema,
} from 'rxdb';

import type { TicketStateCallbackType } from '$lib/machines/ticketMachine';
import { ActorType } from '$lib/util/constants';
import { nanoid } from 'nanoid';
import type { ShowDocument } from './show';
import {
  TransactionString,
  type TransactionDocument,
  type TransactionReasonType,
} from './transaction';

export enum TicketStatus {
  RESERVED = 'RESERVED',
  CANCELLATION_REQUESTED = 'CANCELLATION REQUESTED',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
  REDEEMED = 'REDEEMED',
  IN_ESCROW = 'IN ESCROW',
  IN_DISPUTE = 'IN DISPUTE',
  REFUNDED = 'REFUNDED',
  MISSED_SHOW = 'MISSED SHOW',
  SHOW_CANCELLED = 'SHOW CANCELLED',
}

export enum TicketCancelReason {
  SHOW_CANCELLED = 'SHOW CANCELLED',
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
}

export enum TicketDisputeDecision {
  TALENT_WON = 'TALENT WON',
  CUSTOMER_WON = 'CUSTOMER WON',
  SPLIT = 'SPLIT',
}

export enum TicketDisputeReason {
  ATTEMPTED_SCAM = 'ATTEMPTED SCAM',
  ENDED_EARLY = 'ENDED EARLY',
  LOW_QUALITY = 'LOW QUALITY',
  TALENT_NO_SHOW = 'TALENT NO SHOW',
  SHOW_NEVER_STARTED = 'SHOW NEVER STARTED',
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
  saveTicketStateCallback: async function (this: TicketDocument, ticketState) {
    return await this.atomicPatch({
      ticketState,
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
      show: this.show,
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
        },
        active: {
          type: 'boolean',
        },
        price: {
          type: 'integer',
          minimum: 0,
          maximum: 99999,
        },
        totalPaid: {
          type: 'integer',
          minimum: 0,
          maximum: 99999,
        },
        refundedAmount: {
          type: 'integer',
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
        redemption: {
          type: 'object',
          properties: {
            createdAt: { type: 'integer' },
          },
          required: ['createdAt'],
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
            reason: {
              type: 'string',
              enum: Object.values(TicketDisputeReason),
            },
            explanation: { type: 'string' },
            outcome: {
              type: 'object',
              properties: {
                decision: {
                  type: 'string',
                  enum: Object.values(TicketDisputeDecision),
                },
              },
              required: ['decision'],
            },
          },
          required: ['startedAt', 'disputer', 'reason', 'explanation'],
        },
        finalize: {
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
              minimum: 0,
              maximum: 5,
            },
            review: {
              type: 'string',
              maxLength: 500,
            },
            createdAt: { type: 'integer' },
          },
          required: ['createdAt', 'rating'],
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
        'active',
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
    'talent',
    'agent',
    'show',
    'paymentAddress',
    'ticketState',
    'createdAt',
    '_id',
  ],
  indexes: [['show', 'entityType'], ['entityType']],
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

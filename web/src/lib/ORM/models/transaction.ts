import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxDocument,
  type RxJsonSchema,
} from 'rxdb';
import type { TicketDocument } from './ticket';

export enum TransactionReasonType {
  TICKET_PAYMENT = 'TICKET PAYMENT',
  TICKET_REFUND = 'TICKET REFUND',
  DISPUTE_RESOLUTION = 'DISPUTE RESOLUTION',
}

const transactionSchemaLiteral = {
  title: 'transaction',
  description: 'representation of Ethereum transaction',
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
      default: 'transaction',
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
    hash: {
      type: 'string',
      maxLength: 66,
    },
    block: {
      type: 'integer',
    },
    from: {
      type: 'string',
      maxLength: 42,
    },
    to: {
      type: 'string',
      maxLength: 42,
    },
    reason: {
      type: 'string',
      enum: Object.values(TransactionReasonType),
    },
    value: {
      type: 'string',
    },
    ticket: {
      type: 'string',
      maxLength: 50,
      ref: 'tickets',
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
  },
  indexes: [],
  required: [
    '_id',
    'createdAt',
    'hash',
    'block',
    'from',
    'to',
    'reason',
    'value',
    'ticket',
    'talent',
    'agent',
  ],
} as const;

type transactionRef = {
  ticket_?: Promise<TicketDocument>;
};

export const TransactionString = 'transaction';

const schemaTyped = toTypedRxJsonSchema(transactionSchemaLiteral);
export type TransactionDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const transactionSchema: RxJsonSchema<TransactionDocType> =
  transactionSchemaLiteral;
export type TransactionDocument = RxDocument<TransactionDocType> &
  transactionRef;
export type TransactionCollection = RxCollection<TransactionDocType>;

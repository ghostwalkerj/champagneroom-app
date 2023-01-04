import type { StateCallBackType, ticketCounterCallBackType } from '$lib/machines/showMachine';
import { nanoid } from 'nanoid';
import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxDocument,
  type RxJsonSchema
} from 'rxdb';
import type { AgentDocument } from './agent';
import type { TalentDocument } from './talent';
import { TicketStatus, TicketString, type TicketDocType, type TicketDocument } from './ticket';

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
  ENDED
}

type ShowDocMethods = {
  saveState: () => {
    updateShowStateCallBack: StateCallBackType;
    ticketCounter: ticketCounterCallBackType;
  };
  createTicket: (ticketProps: { name: string, pin: string; }) => Promise<TicketDocument>;
  refundTickets: () => void;
};
export const showDocMethods: ShowDocMethods = {
  saveState: function (this: ShowDocument) {
    const updateShowStateCallBack = () => {
      return (_showState: ShowDocument['showState']) => {
        if (_showState.updatedAt > this.showState.updatedAt) {
          const atomicUpdate = (showDoc: ShowDocType) => {
            const newState = {
              ...showDoc.showState,
              ..._showState
            };
            return {
              ...showDoc,
              showState: newState
            };
          };
          this.atomicUpdate(atomicUpdate);
        }
      };
    };
    const ticketCounter = () => {
      return {
        increment: () => {
          this.update({ $inc: { 'showState.ticketsAvailable': 1 } });
        },
        decrement: () => {
          this.update({ $inc: { 'showState.ticketsAvailable': -1 } });
        }
      };
    };
    return {
      updateShowStateCallBack, ticketCounter
    };
  },
  createTicket: async function (this: ShowDocument, ticketProps: { name: string, pin: string; }) {
    const db = this.collection.database;
    const ticket = {
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
        }
      }
    } as TicketDocType;
    return db.tickets.insert(ticket);
  },
  refundTickets: async function (this: ShowDocument) { //TODO: implement
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
        },
        updatedAt: { type: 'integer' },
        ticketsAvailable: { type: 'integer' },
        cancel: {
          type: 'object',
          properties: {
            createdAt: { type: 'integer' },
            canceledInState: { type: 'string' },
            transactions: {
              type: 'array',
              ref: 'transactions',
              items: { type: 'string' }
            }
          },
          required: ['createdAt', 'canceledInState']
        },

      },
      required: ['status', 'updatedAt', 'ticketsAvailable']
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
  required: ['_id', 'createdAt', 'agent', 'talent', 'duration', 'price', 'name', 'maxNumTickets', 'roomId', 'salesStats', 'showState', 'talentInfo'],
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
export type ShowDocument = RxDocument<ShowDocType, ShowDocMethods> & showRef;
export type ShowCollection = RxCollection<ShowDocType, ShowDocMethods>;

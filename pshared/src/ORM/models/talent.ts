import type { AgentDocument } from './agent';
import { nanoid } from 'nanoid';
import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxDocument,
  type RxJsonSchema,
} from 'rxdb';
import { v4 as uuidv4 } from 'uuid';
import {
  ShowStatus,
  ShowString,
  type ShowDocType,
  type ShowDocument,
} from './show';
import type { TicketDocument } from './ticket';
import { TicketStatus } from './ticket';

export const TalentString = 'talent';

const talentSchemaLiteral = {
  title: 'talent',
  description: 'creator of content',
  version: 0,
  type: 'object',
  primaryKey: '_id',
  properties: {
    _id: {
      type: 'string',
      maxLength: 50,
      final: true,
    },
    key: {
      type: 'string',
      maxLength: 30,
    },
    entityType: {
      type: 'string',
      default: 'talent',
      maxLength: 20,
      final: true,
    },
    walletAddress: {
      type: 'string',
      maxLength: 50,
    },
    name: {
      type: 'string',
      maxLength: 50,
    },
    profileImageUrl: {
      type: 'string',
    },
    agentCommission: {
      type: 'integer',
      default: 0,
      minimum: 0,
      maximum: 100,
    },
    currentShow: {
      type: 'string',
      maxLength: 50,
      ref: 'shows',
    },
    stats: {
      type: 'object',
      properties: {
        ratingAvg: {
          type: 'number',
          minimum: 0,
          maximum: 5,
        },
        totalRating: {
          type: 'integer',
          minimum: 0,
        },
        numCompletedShows: {
          type: 'integer',
          minimum: 0,
        },
        totalEarnings: {
          type: 'number',
          minimum: 0,
        },
        completedShows: {
          type: 'array',
          ref: 'shows',
          items: {
            type: 'string',
            maxLength: 50,
          },
        },
      },
      required: [
        'ratingAvg',
        'totalRating',
        'numCompletedShows',
        'totalEarnings',
        'completedShows',
      ],
    },
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
    agent: { type: 'string', ref: 'agents', maxLength: 50 },
  },
  required: [
    '_id',
    'key',
    'name',
    'stats',
    'profileImageUrl',
    'agent',
    'agentCommission',
    'createdAt',
  ],
  indexes: [['key', 'entityType'], ['agent', 'entityType'], ['entityType']],
} as const;

type talentRef = {
  currentShow_?: Promise<ShowDocument>;
  agent_?: Promise<AgentDocument>;
};

type TalentDocMethods = {
  createShow: (showProps: {
    duration: number;
    name: string;
    maxNumTickets: number;
    price: number;
  }) => Promise<ShowDocument>;
  updateStats: () => Promise<TalentDocument['stats']>;
  getStatsByRange: (range?: {
    start: number;
    end: number;
  }) => Promise<TalentDocument['stats']>;
};

export const talentDocMethods: TalentDocMethods = {
  createShow: async function (
    this: TalentDocument,
    showProps: {
      duration: number;
      name: string;
      maxNumTickets: number;
      price: number;
    }
  ): Promise<ShowDocument> {
    const db = this.collection.database;
    const show = {
      ...showProps,
      talent: this._id,
      talentInfo: {
        name: this.name,
        profileImageUrl: this.profileImageUrl,
        stats: {
          ratingAvg: this.stats.ratingAvg,
          numCompletedShows: this.stats.numCompletedShows,
        },
      },
      showState: {
        status: ShowStatus.BOX_OFFICE_OPEN,
        updatedAt: new Date().getTime(),
        ticketsAvailable: showProps.maxNumTickets,
        ticketsSold: 0,
        ticketsReserved: 0,
        ticketsRefunded: 0,
        totalSales: 0,
        refundedAmount: 0,
        active: true,
      },
      _id: `${ShowString}:sh-${nanoid()}`,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      agent: this.agent,
      roomId: uuidv4(),
      maxNumTickets: showProps.maxNumTickets,
    } as ShowDocType;

    const newShow = await db.shows.insert(show);
    this.update({ $set: { currentShow: newShow._id } });
    return newShow;
  },

  updateStats: async function (
    this: TalentDocument
  ): Promise<TalentDocument['stats']> {
    const stats = await this.getStatsByRange({
      start: 0,
      end: new Date().getTime(),
    });
    this.atomicPatch({
      stats,
      updatedAt: new Date().getTime(),
    });
    return stats;
  },

  getStatsByRange: async function (
    this: TalentDocument,
    range = { start: 0, end: new Date().getTime() }
  ): Promise<TalentDocument['stats']> {
    let ratingAvg = 0;
    let totalRating = 0;
    let totalEarnings = 0;
    let numRatings = 0;
    const db = this.collection.database;
    const completedTicketIds: string[] = [];
    const completedShowsSet = new Set<string>();

    const completedTickets = (await db.tickets
      .find({
        selector: {
          talent: this._id,
          ticketState: {
            status: TicketStatus.FINALIZED,
            finalized: {
              endedAt: { $gte: range.start, $lte: range.end },
            },
          },
        },
      })
      .exec()) as TicketDocument[];

    completedTickets.map(ticket => {
      completedShowsSet.add(ticket.show);
      totalEarnings += ticket.ticketState.totalPaid || 0;
      if (ticket.ticketState.feedback?.rating) {
        totalRating += ticket.ticketState.feedback.rating;
        numRatings++;
      }
      completedTicketIds.push(ticket._id);
    });
    if (numRatings > 0) {
      ratingAvg = totalRating / numRatings;
    }
    const stats = {
      ratingAvg,
      totalEarnings,
      totalRating,
      completedShows: Array.from(completedShowsSet),
      numCompletedShows: completedShowsSet.size,
    };
    return stats;
  },
};

const schemaTyped = toTypedRxJsonSchema(talentSchemaLiteral);
export type TalentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const talentSchema: RxJsonSchema<TalentDocType> = talentSchemaLiteral;
export type TalentDocument = RxDocument<TalentDocType, TalentDocMethods> &
  talentRef;
export type TalentCollection = RxCollection<TalentDocType, TalentDocMethods>;
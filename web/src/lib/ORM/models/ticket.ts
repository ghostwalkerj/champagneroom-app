import type { AgentDocument } from '$lib/ORM/models/agent';

import type { TalentDocument } from '$lib/ORM/models/talent';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';

import type { ShowDocument } from './show';

export enum TicketStatus {
	UNCLAIMED,
	CLAIMED,
	CANCELED,
	FINALIZED,
	IN_ESCROW,
	IN_DISPUTE,
	CANCELLATION_REQUESTED
}

export enum ActorType {
	AGENT,
	TALENT,
	CUSTOMER
}

export enum DisputeDecision {
	TALENT_WON,
	CUSTOMER_WON,
	SPLIT
}

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
			maxLength: 50
		},
		entityType: {
			type: 'string',
			default: 'ticket',
			maxLength: 20,
			final: true
		},
		fundingAddress: {
			type: 'string',
			maxLength: 50
		},
		price: {
			type: 'integer',
			default: 0,
			minimum: 0,
			maximum: 99999
		},
		ticketState: {
			type: 'object',
			properties: {
				status: {
					type: 'string',
					enum: Object.values(TicketStatus),
					default: TicketStatus.UNCLAIMED
				},
				refundedAmount: {
					type: 'integer',
					default: 0,
					minimum: 0,
					maximum: 99999
				},
				cancel: {
					type: 'object',
					properties: {
						createdAt: { type: 'integer' },
						canceler: {
							type: 'string',
							enum: Object.values(ActorType)
						},
						canceledInState: { type: 'string' },
						transactions: {
							type: 'array',
							ref: 'transactions',
							items: { type: 'string' }
						}
					},
					required: ['createdAt', 'canceler', 'canceledInState']
				},
				claim: {
					type: 'object',
					properties: {
						caller: { type: 'string' },
						pin: { type: 'string' },
						createdAt: { type: 'integer' },
						transactions: {
							type: 'array',
							ref: 'transactions',
							items: { type: 'string' }
						},
						call: {
							type: 'object',
							properties: {
								startedAt: { type: 'integer' },
								endedAt: { type: 'integer' },
								callEvents: { type: 'array', ref: 'callEvents', items: { type: 'string' } }
							}
						}
					},
					required: ['caller', 'pin', 'createdAt']
				},
				escrow: {
					type: 'object',
					properties: {
						startedAt: { type: 'integer' },
						endedAt: { type: 'integer' }
					},
					required: ['startedAt']
				},
				dispute: {
					type: 'object',
					properties: {
						startedAt: { type: 'integer' },
						endedAt: { type: 'integer' },
						disputer: {
							type: 'string',
							enum: Object.values(ActorType)
						},
						outcome: {
							type: 'object',
							properties: {
								decision: {
									type: 'string',
									enum: Object.values(DisputeDecision)
								},
								transactions: {
									type: 'array',
									ref: 'transactions',
									items: { type: 'string' }
								}
							},
							required: ['decision']
						}
					},
					required: ['startedAt', 'disputer']
				},
				finalized: {
					type: 'object',
					properties: {
						endedAt: { type: 'integer' },
						transactions: {
							type: 'array',
							ref: 'transactions',
							items: { type: 'string' }
						}
					},
					required: ['endedAt']
				},
				feedback: {
					type: 'object',
					properties: {
						rating: {
							type: 'integer',
							default: 0,
							minimum: 0,
							maximum: 5
						},
						comment: {
							type: 'string',
							maxLength: 500
						},
						createdAt: { type: 'integer' }
					},
					required: ['createdAt', 'rating']
				},
				updatedAt: { type: 'integer' }
			},
			required: ['status', 'totalFunding', 'requestedAmount', 'refundedAmount', 'updatedAt']
		},
		talent: { type: 'string', ref: 'talents', maxLength: 50 },
		agent: { type: 'string', ref: 'agents', maxLength: 70 },
		show: { type: 'string', ref: 'shows', maxLength: 50 },
		createdAt: {
			type: 'integer'
		},
		updatedAt: {
			type: 'integer'
		},
		_deleted: {
			type: 'boolean',
			default: false
		}
	},
	required: [
		'_id',
		'talent',
		'agent',
		'show',
		'price',
		'fundingAddress',
		'createdAt'
	],
	indexes: []
} as const;

type ticketRef = {
	talent_?: Promise<TalentDocument>;
	agent_?: Promise<AgentDocument>;
	show_?: Promise<ShowDocument>;
};

const schemaTyped = toTypedRxJsonSchema(ticketSchemaLiteral);
export type TicketDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const ticketSchema: RxJsonSchema<TicketDocType> = ticketSchemaLiteral;
export type TicketDocument = RxDocument<TicketDocType> & ticketRef;
export type TicketCollection = RxCollection<TicketDocType>;

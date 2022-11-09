import type { AgentDocument } from '$lib/ORM/models/agent';
import {
	CallEventString,
	type CallEventDocType,
	type CallEventDocument,
	type CallEventType
} from '$lib/ORM/models/callEvent';
import type { TalentDocument } from '$lib/ORM/models/talent';
import { nanoid } from 'nanoid';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import {
	TransactionReasonType,
	TransactionString,
	type TransactionDocType,
	type TransactionDocument
} from './transaction';

export enum LinkStatus {
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
	CALLER
}

export enum DisputeDecision {
	TALENT_WON,
	CALLER_WON,
	SPLIT
}

type LinkDocMethods = {
	createTransaction: (transaction: {
		hash: string;
		block: number;
		from: string;
		to: string;
		value: string;
		reason: TransactionReasonType;
	}) => Promise<TransactionDocument>;
	createCallEvent: (type: CallEventType) => Promise<CallEventDocument>;
};

export const linkDocMethods: LinkDocMethods = {
	createTransaction: async function (
		this: LinkDocument,
		transaction: {
			hash: string;
			block: number;
			from: string;
			to: string;
			value: string;
			reason: TransactionReasonType;
		}
	) {
		const db = this.collection.database;
		const _transaction: TransactionDocType = {
			_id: `${TransactionString}:tr-${nanoid()}`,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime(),
			link: this._id,
			talent: this.talent,
			...transaction
		};
		return db.transactions.insert(_transaction);
	},
	createCallEvent: async function (this: LinkDocument, type: CallEventType) {
		const _linkState = this.linkState;
		if (!_linkState.claim) throw new Error('Link not claimed');

		const db = this.collection.database;
		const _callEvent: CallEventDocType = {
			_id: `${CallEventString}:ce-${nanoid()}`,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime(),
			link: this._id,
			talent: this.talent,
			type
		};
		return db.callEvents.insert(_callEvent);
	}
};

export const LinkString = 'link';
const linkSchemaLiteral = {
	title: 'link',
	description: 'onetime link to call',
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
			default: 'link',
			maxLength: 20,
			final: true
		},
		fundingAddress: {
			type: 'string',
			maxLength: 50
		},
		requestedAmount: {
			type: 'integer',
			default: 0,
			minimum: 0,
			maximum: 99999
		},
		callId: { type: 'string' },
		linkState: {
			type: 'object',
			properties: {
				status: {
					type: 'string',
					enum: Object.values(LinkStatus),
					default: LinkStatus.UNCLAIMED
				},
				totalFunding: {
					type: 'integer',
					default: 0,
					minimum: 0,
					maximum: 99999
				},
				requestedFunding: {
					type: 'integer',
					default: 0,
					minimum: 0,
					maximum: 99999
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
					required: ['caller', 'pin', 'createdAt', 'call']
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
						comments: {
							type: 'string',
							maxLength: 500
						},
						createdAt: { type: 'integer' }
					},
					required: ['createdAt', 'rating']
				}
			},
			required: ['status', 'totalFunding', 'requestedFunding', 'refundedAmount']
		},
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
						numCompletedCalls: {
							type: 'integer',
							minimum: 0
						},
						ratingAvg: {
							type: 'number',
							minimum: 0,
							maximum: 5
						}
					},
					required: ['numCompletedCalls', 'ratingAvg']
				}
			},
			required: ['profileImageUrl', 'name', 'stats']
		},
		talent: { type: 'string', ref: 'talents', maxLength: 50 },
		agent: { type: 'string', ref: 'agents', maxLength: 70 },
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
		'linkState',
		'talent',
		'agent',
		'talentInfo',
		'callId',
		'requestedAmount',
		'fundingAddress',
		'createdAt'
	],
	indexes: ['talent', 'connections', 'agent', 'linkState.status', 'linkState.finalized.endedAt'],
	encrypted: ['callId', 'linkState.claim.pin']
} as const;

type linkRef = {
	talent_?: Promise<TalentDocument>;
	agent_?: Promise<AgentDocument>;
	callEvents_?: Promise<CallEventDocument>;
	transactions_?: Promise<TransactionDocument[]>;
};

const schemaTyped = toTypedRxJsonSchema(linkSchemaLiteral);
export type LinkDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const linkSchema: RxJsonSchema<LinkDocType> = linkSchemaLiteral;
export type LinkDocument = RxDocument<LinkDocType, LinkDocMethods> & linkRef;
export type LinkCollection = RxCollection<LinkDocType, LinkDocMethods>;

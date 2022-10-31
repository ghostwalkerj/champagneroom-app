import type { AgentDocument } from '$lib/ORM/models/agent';
import { LinkStatus, LinkString, type LinkDocument } from '$lib/ORM/models/link';
import { nanoid } from 'nanoid';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import { v4 as uuidv4 } from 'uuid';

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
			final: true
		},
		key: {
			type: 'string',
			maxLength: 30
		},
		entityType: {
			type: 'string',
			default: 'talent',
			maxLength: 20,
			final: true
		},
		walletAddress: {
			type: 'string',
			maxLength: 50
		},
		name: {
			type: 'string',
			maxLength: 50
		},
		profileImageUrl: {
			type: 'string'
		},
		agentCommission: {
			type: 'integer',
			default: 0,
			minimum: 0,
			maximum: 100
		},
		currentLink: {
			type: 'string',
			maxLength: 50,
			ref: 'links'
		},
		stats: {
			type: 'object',
			properties: {
				ratingAvg: {
					type: 'number',
					minimum: 0,
					maximum: 5
				},
				totalRating: {
					type: 'integer',
					minimum: 0
				},
				numCompletedCalls: {
					type: 'integer',
					minimum: 0
				},
				totalEarnings: {
					type: 'number',
					minimum: 0
				},
				completedCalls: {
					type: 'array',
					ref: 'links',
					items: {
						type: 'string',
						maxLength: 50
					}
				}
			},
			required: ['ratingAvg', 'totalRating', 'numCompletedCalls', 'totalEarnings', 'completedCalls']
		},
		createdAt: {
			type: 'integer'
		},
		updatedAt: {
			type: 'integer'
		},
		_deleted: {
			type: 'boolean',
			default: false
		},
		agent: { type: 'string', ref: 'agents', maxLength: 50 }
	},
	required: [
		'_id',
		'key',
		'name',
		'stats',
		'profileImageUrl',
		'agent',
		'agentCommission',
		'createdAt'
	],
	indexes: ['key', 'agent']
} as const;

type talentRef = {
	currentLink_?: Promise<LinkDocument>;
	agent_?: Promise<AgentDocument>;
};

type TalentDocMethods = {
	createLink: (amount: number) => Promise<LinkDocument>;
	updateStats: () => Promise<TalentDocument['stats']>;
	getStatsByRange: (range?: { start: number; end: number }) => Promise<TalentDocument['stats']>;
};

export const talentDocMethods: TalentDocMethods = {
	createLink: async function (
		this: TalentDocument,
		requestedAmount: number
	): Promise<LinkDocument> {
		const db = this.collection.database;
		const key = nanoid();
		const _link = {
			linkState: {
				status: LinkStatus.UNCLAIMED,
				totalFunding: 0,
				refundedAmount: 0,
				requestedFunding: requestedAmount
			},
			requestedAmount,
			fundingAddress: '0x251281e1516e6E0A145d28a41EE63BfcDd9E18Bf', //TODO: make real wallet
			callId: uuidv4(),
			talent: this._id,
			talentInfo: {
				name: this.name,
				profileImageUrl: this.profileImageUrl,
				stats: {
					ratingAvg: this.stats.ratingAvg,
					numCompletedCalls: this.stats.numCompletedCalls
				}
			},
			_id: `${LinkString}:l${key}`,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime(),
			entityType: LinkString,
			agent: this.agent
		};
		const link = await db.links.insert(_link);
		this.update({ $set: { currentLink: link._id } });
		return link;
	},

	updateStats: async function (this: TalentDocument): Promise<TalentDocument['stats']> {
		const stats = await this.getStatsByRange({ start: 0, end: new Date().getTime() });

		this.atomicPatch({
			stats,
			updatedAt: new Date().getTime()
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
		const completedCallIds: string[] = [];
		const completedCalls = (await db.links
			.find({
				selector: {
					talent: this._id,
					linkState: {
						status: LinkStatus.FINALIZED,
						finalized: {
							endedAt: { $gte: range.start, $lte: range.end }
						}
					}
				}
			})
			.exec()) as LinkDocument[];

		completedCalls.map((link) => {
			totalEarnings += link.linkState.totalFunding;
			if (link.linkState.finalized?.feedback) {
				totalRating += link.linkState.finalized.feedback.rating;
				numRatings++;
			}
			completedCallIds.push(link._id);
		});
		if (numRatings > 0) {
			ratingAvg = totalRating / numRatings;
		}
		const stats = {
			ratingAvg,
			totalEarnings,
			totalRating,
			completedCalls: completedCallIds,
			numCompletedCalls: completedCalls.length
		};
		return stats;
	}
};

const schemaTyped = toTypedRxJsonSchema(talentSchemaLiteral);
export type TalentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const talentSchema: RxJsonSchema<TalentDocType> = talentSchemaLiteral;
export type TalentDocument = RxDocument<TalentDocType, TalentDocMethods> & talentRef;
export type TalentCollection = RxCollection<TalentDocType, TalentDocMethods>;

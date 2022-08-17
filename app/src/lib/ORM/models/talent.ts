import type { AgentDocument } from '$lib/ORM/models/agent';
import { FeedbackString } from '$lib/ORM/models/feedback';
import { LinkStatuses, LinkString, type LinkDocument } from '$lib/ORM/models/link';
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
		createdAt: {
			type: 'integer'
		},
		updatedAt: {
			type: 'integer'
		},
		agent: { type: 'string', ref: 'agents', maxLength: 50 }
	},
	required: ['_id', 'key', 'name', 'profileImageUrl', 'agent', 'agentCommission'],
	indexed: ['key', 'agent']
} as const;

export type TalentStats = {
	ratingAvg: number;
	totalEarnings: number;
	completedCalls: LinkDocument[];
};

type talentRef = {
	currentLink_?: Promise<LinkDocument>;
	agent_?: Promise<AgentDocument>;
};

type TalentDocMethods = {
	createLink: (amount: number) => Promise<LinkDocument>;
	getStats: (range?: { start: number; end: number }) => Promise<TalentStats>;
};

export const talentDocMethods: TalentDocMethods = {
	createLink: async function (this: TalentDocument, amount: number): Promise<LinkDocument> {
		const db = this.collection.database;
		const key = nanoid();

		const _feedback = {
			_id: `${FeedbackString}:f${key}`,
			entityType: FeedbackString,
			createdAt: new Date().getTime(),
			rejected: 0,
			disconnected: 0,
			unanswered: 0,
			viewed: 0,
			rating: 0,
			link: `${LinkString}:l${key}`,
			talent: this._id,
			agent: this.agent
		};
		const _link = {
			status: LinkStatuses.ACTIVE,
			fundedAmount: 0,
			amount,
			walletAddress: '0x251281e1516e6E0A145d28a41EE63BfcDd9E18Bf', //TODO: make real wallet
			callId: uuidv4(),
			talentName: this.name,
			talent: this._id,
			profileImageUrl: this.profileImageUrl,
			_id: `${LinkString}:l${key}`,
			createdAt: new Date().getTime(),
			entityType: LinkString,
			feedback: `${FeedbackString}:f${key}`,
			agent: this.agent
		};

		if (this.currentLink) {
			const currentLink = await this.populate('currentLink');
			if (currentLink && currentLink.status === LinkStatuses.ACTIVE) {
				currentLink.update({ $set: { status: LinkStatuses.EXPIRED } });
			}
		}

		db.feedbacks.insert(_feedback);
		const link = await db.links.insert(_link);
		this.update({ $set: { currentLink: link._id } });
		return link;
	},
	getStats: async function (
		this: TalentDocument,
		range = { start: 0, end: new Date().getTime() }
	): Promise<TalentStats> {
		let ratingAvg = 0;
		let totalRating = 0;
		let totalEarnings = 0;
		const db = this.collection.database;
		const completedCalls = (await db.links
			.find({
				selector: {
					talent: this._id,
					status: LinkStatuses.COMPLETED,
					callStart: { $gte: range.start, $lte: range.end }
				}
			})
			.exec()) as LinkDocument[];

		const feedbackIds = completedCalls.map((link) => {
			totalEarnings += link.amount;
			return link.feedback;
		});
		const completedFeedback = await db.feedbacks.findByIds(feedbackIds);
		for (const feedback of completedFeedback.values()) {
			totalRating += feedback.rating;
		}
		if (completedFeedback.size > 0) {
			ratingAvg = totalRating / completedFeedback.size;
		}
		return {
			ratingAvg,
			totalEarnings,
			completedCalls
		};
	}
};

const schemaTyped = toTypedRxJsonSchema(talentSchemaLiteral);
export type TalentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const talentSchema: RxJsonSchema<TalentDocType> = talentSchemaLiteral;
export type TalentDocument = RxDocument<TalentDocType, TalentDocMethods> & talentRef;
export type TalentCollection = RxCollection<TalentDocType, TalentDocMethods>;

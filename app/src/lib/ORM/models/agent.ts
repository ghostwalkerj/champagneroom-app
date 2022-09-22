import { TalentString, type TalentDocType, type TalentDocument } from '$lib/ORM/models/talent';
import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';
import { nanoid } from 'nanoid';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema

} from 'rxdb';
type AgentDocMethods = {
	createTalent: (
		name: string,
		agentCommission: number,
		profileImageUrl?: string
	) => Promise<TalentDocument>;
};

export const AgentString = 'agent';

type AgentStaticMethods = {
	createAgent: (address: string) => Promise<AgentDocument>;
};
export const agentDocMethods: AgentDocMethods = {
	createTalent: async function (
		this: AgentDocument,
		name: string,
		agentCommission: number,
		profileImageUrl: string = PUBLIC_DEFAULT_PROFILE_IMAGE
	) {
		const _talent: TalentDocType = {
			_id: `${TalentString}:t${nanoid()}`,
			name,
			agentCommission,
			key: nanoid(),
			agent: this._id,
			profileImageUrl,
			stats: {
				ratingAvg: 0,
				totalEarnings: 0,
				totalRating: 0,
				completedCalls: [],
				completedFeedbacks: [],
				numCompletedCalls: 0
			},
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		};

		const db = this.collection.database;
		const talent = await db.talents.insert(_talent);

		const talents = this.talents ? this.talents.concat([talent._id]) : [talent._id];
		this.update({ $set: { talents } });
		return talent;
	}
};
export const agentStaticMethods: AgentStaticMethods = {
	createAgent: async function (this: AgentCollection, address: string) {
		const _agent = await this.insert({
			_id: `${AgentString}:${address}`,
			address,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
		return _agent;
	}
};
const agentSchemaLiteral = {
	title: 'agent',
	description: 'manages talent',
	version: 0,
	type: 'object',
	primaryKey: '_id',
	properties: {
		_id: {
			type: 'string',
			maxLength: 70
		},
		contextId: {
			type: 'string',
			maxLength: 30
		},
		entityType: {
			type: 'string',
			default: 'agent',
			maxLength: 20,
			final: true
		},
		address: {
			type: 'string',
			maxLength: 50,
			unique: true,
			final: true
		},
		walletAddress: { type: 'string', maxLength: 50 },
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
		talents: {
			type: 'array',
			ref: 'talents',
			items: {
				type: 'string',
				maxLength: 50
			},
			default: []
		}
	},
	required: ['_id', 'address', 'createdAt']
} as const;
type agentRef = {
	talents_?: Promise<TalentDocument[]>;
};
const schemaTyped = toTypedRxJsonSchema(agentSchemaLiteral);
export type AgentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const agentSchema: RxJsonSchema<AgentDocType> = agentSchemaLiteral;
export type AgentDocument = RxDocument<AgentDocType, AgentDocMethods> & agentRef;
export type AgentCollection = RxCollection<AgentDocType, AgentDocMethods, AgentStaticMethods>;

import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import type { AgentDocument } from '$lib/db/models/agent';
import type { LinkDocument } from '$lib/db/models/link';

export const TalentType = 'talent';

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
		ratingAvg: {
			type: 'number',
			minimum: 0,
			maximum: 5,
			default: 0
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
			ref: 'link'
		},
		createdAt: {
			type: 'string'
		},
		updatedAt: {
			type: 'string'
		},
		agent: { type: 'string', ref: 'agent', maxLength: 50 }
	},
	required: ['_id', 'key', 'name', 'profileImageUrl', 'agent'],
	encrypted: ['key']
} as const;

type talentRef = {
	currentLink_?: Promise<LinkDocument>;
	agent_?: Promise<AgentDocument>;
};
const schemaTyped = toTypedRxJsonSchema(talentSchemaLiteral);
export type TalentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const talentSchema: RxJsonSchema<TalentDocType> = talentSchemaLiteral;
export type TalentDocument = RxDocument<TalentDocType> & talentRef;
export type TalentCollection = RxCollection<TalentDocType>;

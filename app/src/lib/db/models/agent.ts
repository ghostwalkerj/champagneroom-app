import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import type { TalentDocument } from '$lib/db/models/talent';

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
		createdAt: {
			type: 'string'
		},
		updatedAt: {
			type: 'string'
		},
		talents: {
			type: 'array',
			ref: 'talent',
			items: {
				type: 'string',
				maxLength: 50
			}
		}
	},
	required: ['_id', 'address']
} as const;

type agentRef = {
	talents_?: Promise<TalentDocument[]>;
};

const schemaTyped = toTypedRxJsonSchema(agentSchemaLiteral);
export type AgentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const agentSchema: RxJsonSchema<AgentDocType> = agentSchemaLiteral;
export type AgentDocument = RxDocument<AgentDocType> & agentRef;
export type AgentCollection = RxCollection<AgentDocType>;
export const AgentType = 'agent';

import { DEFAULT_PROFILE_IMAGE } from '$lib/constants';
import { type TalentDocType, type TalentDocument, TalentType } from '$lib/db/models/talent';
import { nanoid } from 'nanoid';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import { get } from 'svelte/store';
import { currentAgentDB } from '../stores/agentDB';
type AgentDocMethods = {
	createTalent: (name: string, key: string, agentCommission: number) => Promise<TalentDocument>;
};

export const AgentType = 'agent';

type AgentStaticMethods = {
	createAgent: (address: string) => Promise<AgentDocument>;
};
export const agentDocMethods: AgentDocMethods = {
	createTalent: async function (
		this: AgentDocument,
		name: string,
		key: string,
		agentCommission: number
	) {
		const _talent: TalentDocType = {
			_id: TalentType + ':' + nanoid(),
			name,
			agentCommission,
			key,
			agent: this._id,
			profileImageUrl: DEFAULT_PROFILE_IMAGE
		};

		const db = get(currentAgentDB);
		const talent = await db.talents.insert(_talent);

		const talents = this.talents ? this.talents.concat([talent._id]) : [talent._id];
		this.update({ $set: { talents } });
		return talent;
	}
};
export const agentStaticMethods: AgentStaticMethods = {
	createAgent: async function (this: AgentCollection, address: string) {
		const agentId = AgentType + ':' + address;
		const _agent = await this.insert({
			_id: agentId,
			address
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
			ref: 'talents',
			items: {
				type: 'string',
				maxLength: 50
			},
			default: []
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
export type AgentDocument = RxDocument<AgentDocType, AgentDocMethods> & agentRef;
export type AgentCollection = RxCollection<AgentDocType, AgentDocMethods, AgentStaticMethods>;

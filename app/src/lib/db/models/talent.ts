import type { AgentDocument } from '$lib/db/models/agent';
import { LinkStatus, LinkType, type LinkDocument } from '$lib/db/models/link';
import { currentTalentDB } from '$lib/db/stores/talentDB';
import { nanoid } from 'nanoid';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import { get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

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
			ref: 'links'
		},
		createdAt: {
			type: 'string'
		},
		updatedAt: {
			type: 'string'
		},
		agent: { type: 'string', ref: 'agents', maxLength: 50 }
	},
	required: ['_id', 'key', 'name', 'profileImageUrl', 'agent'],
	indexed: ['key']
} as const;

type talentRef = {
	currentLink_?: Promise<LinkDocument>;
	agent_?: Promise<AgentDocument>;
};

type TalentDocMethods = {
	createLink: (amount: number) => Promise<LinkDocument>;
};

export const talentDocMethods: TalentDocMethods = {
	createLink: async function (this: TalentDocument, amount: number): Promise<LinkDocument> {
		const _link = {
			status: LinkStatus.ACTIVE,
			fundedAmount: 0,
			amount,
			walletAddress: '0x251281e1516e6E0A145d28a41EE63BfcDd9E18Bf', //TODO: make real wallet
			callId: uuidv4(),
			talentName: this.name,
			talent: this._id,
			profileImageUrl: this.profileImageUrl,
			_id: LinkType + ':' + nanoid(),
			createdAt: new Date().toISOString(),
			entityType: LinkType
		};

		if (this.currentLink) {
			const currentLink = await this.populate('currentLink');
			currentLink.update({ $set: { status: LinkStatus.EXPIRED } });
		}

		console.log(_link);
		const db = get(currentTalentDB);
		const link = await db.links.insert(_link);
		this.update({ $set: { currentLink: link._id } });
		return link;
	}
};

const schemaTyped = toTypedRxJsonSchema(talentSchemaLiteral);
export type TalentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const talentSchema: RxJsonSchema<TalentDocType> = talentSchemaLiteral;
export type TalentDocument = RxDocument<TalentDocType, TalentDocMethods> & talentRef;
export type TalentCollection = RxCollection<TalentDocType, TalentDocMethods>;

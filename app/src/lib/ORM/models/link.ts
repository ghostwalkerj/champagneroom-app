import type { AgentDocument } from '$lib/ORM/models/agent';
import type { FeedbackDocument } from '$lib/ORM/models/feedback';
import type { TalentDocument } from '$lib/ORM/models/talent';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import fsm from 'svelte-fsm';

export enum LinkStatuses {
	UNCLAIMED = 'UNCLAIMED',
	CANCELLED = 'CANCELLED',
	CLAIMED = 'CLAIMED',
	FINALIZED = 'FINALIZED'
}

const getState = (_this: LinkDocument) => {
	const linkState = fsm('unclaimed', {
		unclaimed: {
			claim: 'claimed',
			cancel: 'cancelled'
		},
		claimed: {
			completeCall: 'waiting4Finalization',
			requestCancellation: 'cancelRequested',
		},
		waiting4Finalization: {
		},
		cancelRequested: {},
		cancelled: {},
		finalized: {}
	});

	return linkState;

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
		amount: {
			type: 'integer',
			default: 0,
			minimum: 0,
			maximum: 99999
		},
		fundedAmount: {
			type: 'integer',
			default: 0,
			minimum: 0,
			maximum: 99999
		},
		callId: { type: 'string' },
		status: { type: 'string', enum: Object.keys(LinkStatuses), maxLength: 20 },
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
		feedback: { type: 'string', ref: 'feedbacks', maxLength: 50 },
		callStart: { type: 'integer', multipleOf: 1, minimum: 0, maximum: 3000000000000 },
		callEnd: { type: 'integer', multipleOf: 1, minimum: 0, maximum: 3000000000000 },
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
		'entityType',
		'talent',
		'agent',
		'talentInfo',
		'callId',
		'amount',
		'fundingAddress',
		'fundedAmount',
		'feedback',
		'createdAt',
		'status'
	],
	indexes: ['talent', 'feedback', 'agent', 'status', 'callStart'],
	encrypted: ['callId']
} as const;

type linkRef = {
	talent_: Promise<TalentDocument>;
	agent_: Promise<AgentDocument>;
	feedback_: Promise<FeedbackDocument>;
};

const schemaTyped = toTypedRxJsonSchema(linkSchemaLiteral);
export type LinkDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const linkSchema: RxJsonSchema<LinkDocType> = linkSchemaLiteral;
export type LinkDocument = RxDocument<LinkDocType> & linkRef;
export type LinkCollection = RxCollection<LinkDocType>;

import { thisPublicDB } from '$lib/ORM/dbs/publicDB';
import { FeedbackString, type FeedbackDocument } from '$lib/ORM/models/feedback';
import type { TalentDocument } from '$lib/ORM/models/talent';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import { get } from 'svelte/store';
export enum LinkStatuses {
	ACTIVE = 'ACTIVE',
	EXPIRED = 'EXPIRED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED'
}

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
		walletAddress: {
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
		status: { type: 'string', enum: Object.keys(LinkStatuses) },
		profileImageUrl: {
			type: 'string'
		},
		talentName: {
			type: 'string',
			maxLength: 50
		},
		talent: { type: 'string', ref: 'talents', maxLength: 50 },
		feedback: { type: 'string', ref: 'feedbacks', maxLength: 50 },
		createdAt: {
			type: 'string'
		},
		updatedAt: {
			type: 'string'
		}
	},
	required: [
		'_id',
		'entityType',
		'talent',
		'talentName',
		'profileImageUrl',
		'callId',
		'amount',
		'fundedAmount'
	],
	encrypted: ['callId']
} as const;

type linkRef = {
	talent_?: Promise<TalentDocument>;
};

const schemaTyped = toTypedRxJsonSchema(linkSchemaLiteral);
export type LinkDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const linkSchema: RxJsonSchema<LinkDocType> = linkSchemaLiteral;
export type LinkDocument = RxDocument<LinkDocType, LinkDocMethods> & linkRef;
export type LinkCollection = RxCollection<LinkDocType, LinkDocMethods>;

type LinkDocMethods = {
	createFeedback: () => Promise<FeedbackDocument>;
};

export const linkDocMethods: LinkDocMethods = {
	createFeedback: async function (this: LinkDocument): Promise<FeedbackDocument> {
		const _feedback = {
			entityType: FeedbackString,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			link: this._id!,
			_id: `${FeedbackString}:${this._id}`,
			createdAt: new Date().toISOString(),
			rejected: 0,
			disconnected: 0,
			unanswered: 0,
			viewed: 0,
			rating: 0
		};
		const db = get(thisPublicDB);
		const feedback = await db.feedbacks.insert(_feedback);
		this.update({ $set: { feedback: _feedback._id } });
		return feedback;
	}
};

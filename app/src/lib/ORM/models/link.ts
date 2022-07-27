import { PCALL_ROOM_URL } from '$lib/constants';
import { thisPublicDB } from '$lib/ORM/client/dbs/publicDB';
import { type FeedbackDocument, FeedbackString } from '$lib/ORM/models/feedback';
import type { TalentDocument } from '$lib/ORM/models/talent';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import { get } from 'svelte/store';
import urlJoin from 'url-join';
export enum LinkStatus {
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
		callStart: { type: 'string' },
		callEnd: { type: 'string' },
		callId: { type: 'string' },
		status: { type: 'string', enum: Object.keys(LinkStatus) },
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
	required: ['entityType', 'talent', 'talentName', 'profileImageUrl', 'callId', 'amount'],
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
	generateLinkURL: () => string;
	createFeedback: () => Promise<FeedbackDocument>;
};

export const linkDocMethods: LinkDocMethods = {
	generateLinkURL: function (this: LinkDocument): string {
		if (this._id) {
			const url = urlJoin(PCALL_ROOM_URL, this._id);
			return url;
		} else {
			console.log("Can't generate link url, link is missing id", this);
			return '';
		}
	},
	createFeedback: async function (this: LinkDocument): Promise<FeedbackDocument> {
		const _feedback = {
			entityType: FeedbackString,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			link: this._id!,
			_id: `${FeedbackString}:${this._id}`,
			createdAt: new Date().toISOString(),
			rejectedCount: 0,
			disconnectCount: 0,
			notAnsweredCount: 0,
			viewedCount: 0,
			rating: 0
		};
		const db = get(thisPublicDB);
		const feedback = await db.feedbacks.insert(_feedback);
		this.update({ $set: { feedback: _feedback._id } });
		return feedback;
	}
};

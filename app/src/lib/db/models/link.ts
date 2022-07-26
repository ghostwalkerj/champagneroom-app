import { PCALL_ROOM_URL } from '$lib/constants';
import { nanoid } from 'nanoid';
import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import urlJoin from 'url-join';
import { v4 as uuidv4 } from 'uuid';
import type { TalentDocument } from './talent';
export enum LinkStatus {
	ACTIVE = 'ACTIVE',
	EXPIRED = 'EXPIRED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED'
}

export const LinkType = 'link';
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
		rating: {
			type: 'integer',
			minimum: 0,
			maximum: 5
		},
		profileImageUrl: {
			type: 'string'
		},
		talentName: {
			type: 'string',
			maxLength: 50
		},
		talent: { type: 'string', ref: 'agent', maxLength: 50 },
		createdAt: {
			type: 'string'
		},
		updatedAt: {
			type: 'string'
		}
	},
	required: ['entityType', 'talent', 'name', 'profileImageUrl', 'callId', 'amount'],
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
	}
};

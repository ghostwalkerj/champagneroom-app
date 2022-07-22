import { PCALL_ROOM_URL } from '$lib/constants';
import { nanoid } from 'nanoid';
import {
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema,
	toTypedRxJsonSchema
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

export const LinkTypes = 'link';
const linkSchemaLiteral = {
	title: 'link',
	description: 'onetime link to call',
	version: 0,
	type: 'object',
	primaryKey: {
		key: '_id',
		fields: ['entityType', 'internalId'],
		separator: ':'
	},
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
			type: 'number'
		},
		updatedAt: {
			type: 'number'
		},
		internalId: {
			type: 'string',
			maxLength: 21,
			default: nanoid(),
			final: true
		}
	},
	required: ['_id', 'entityType', 'internalId', 'talent', 'name', 'profileImageUrl', 'callId'],
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
export type LinkDocument = RxDocument<LinkDocType> & linkRef;
export type LinkCollection = RxCollection<LinkDocType>;

export const generateLinkURL = (link: LinkDocType): string => {
	if (link && link._id) {
		const url = urlJoin(PCALL_ROOM_URL, link._id);
		return url;
	} else {
		console.log("Can't generate link url, link is missing id", link);
		return '';
	}
};

export const createLink = (name: string, talentId: string, profileImageUrl: string) => {
	const link = {
		status: LinkStatus.ACTIVE,
		fundedAmount: '0',
		walletAddress: '0x251281e1516e6E0A145d28a41EE63BfcDd9E18Bf', //TODO: make real wallet
		callId: uuidv4(),
		name,
		talent: talentId,
		profileImageUrl,
		internalId: nanoid()
	};
	return link;
};

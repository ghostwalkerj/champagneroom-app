import { nanoid } from 'nanoid';
import {
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema,
	toTypedRxJsonSchema
} from 'rxdb';
import type { LinkDocument } from './link';

const feedbackSchemaLiteral = {
	title: 'feedback',
	description: 'customer feedback for a link',
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
			maxLength: 70
		},
		entityType: {
			type: 'string',
			default: 'feedback',
			maxLength: 20,
			final: true
		},
		createdAt: { type: 'string' },
		updatedAt: {
			type: 'string'
		},
		link: {
			type: 'string',
			ref: 'link'
		},
		internalId: {
			type: 'string',
			maxLength: 21,
			default: nanoid(),
			final: true
		},
		rejectedCount: {
			type: 'integer',
			default: 0,
			minimum: 0
		},
		disconnectCount: {
			type: 'integer',
			default: 0,
			minimum: 0
		},
		notAnsweredCount: {
			type: 'integer',
			default: 0,
			minimum: 0
		},
		viewedCount: {
			type: 'integer',
			default: 0,
			minimum: 0
		},
		rating: {
			type: 'integer',
			default: 0,
			minimum: 0,
			maximum: 5
		}
	},
	required: ['_id', 'entityType', 'link', 'internalId']
} as const;

type feedbackRef = {
	link_?: Promise<LinkDocument>;
};

export const FeedbackType = 'feedback';

const schemaTyped = toTypedRxJsonSchema(feedbackSchemaLiteral);
export type FeedbackDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const feedbackSchema: RxJsonSchema<FeedbackDocType> = feedbackSchemaLiteral;
export type FeedbackDocument = RxDocument<FeedbackDocType> & feedbackRef;
export type FeedbackCollection = RxCollection<FeedbackDocument>;

export const createFeedback = (linkId: string) => {
	const feedback = {
		link: linkId,
		internalId: nanoid()
	};
	return feedback;
};

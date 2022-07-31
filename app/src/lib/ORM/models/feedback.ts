import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import type { LinkDocument } from './link';

const feedbackSchemaLiteral = {
	title: 'feedback',
	description: ' feedback for a link',
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
			ref: 'links'
		},
		talent: {
			type: 'string',
			ref: 'talents'
		},
		rejected: {
			type: 'integer',
			default: 0,
			minimum: 0
		},
		disconnected: {
			type: 'integer',
			default: 0,
			minimum: 0
		},
		unanswered: {
			type: 'integer',
			default: 0,
			minimum: 0
		},
		viewed: {
			type: 'integer',
			default: 0,
			minimum: 0
		},
		rating: {
			type: 'integer',
			default: 0,
			minimum: 0,
			maximum: 5
		},
		callStart: { type: 'string' },
		callEnd: { type: 'string' }
	},
	indexed: ['talent', 'link'],
	required: [
		'_id',
		'entityType',
		'viewed',
		'rejected',
		'disconnected',
		'unanswered',
		'rating',
		'link',
		'talent'
	]
} as const;

type feedbackRef = {
	link_?: Promise<LinkDocument>;
};

export const FeedbackString = 'feedback';

const schemaTyped = toTypedRxJsonSchema(feedbackSchemaLiteral);
export type FeedbackDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const feedbackSchema: RxJsonSchema<FeedbackDocType> = feedbackSchemaLiteral;
export type FeedbackDocument = RxDocument<FeedbackDocType> & feedbackRef;
export type FeedbackCollection = RxCollection<FeedbackDocType>;

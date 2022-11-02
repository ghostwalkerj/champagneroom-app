import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import type { LinkDocument } from './link';

export enum CallEventType {
	ATTEMPT,
	CONNECT,
	DISCONNECTED,
	NO_ANSWER,
	CALLER_HANGUP,
	CALLEE_HANGUP
}

const CallEventSchemaLiteral = {
	title: 'callEvent',
	description: 'callEvent for a link',
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
			default: 'callEvent',
			maxLength: 20,
			final: true
		},
		createdAt: { type: 'integer' },
		updatedAt: { type: 'integer' },
		endedAt: { type: 'integer' },
		_deleted: {
			type: 'boolean',
			default: false
		},
		type: {
			type: 'string',
			enum: Object.values(CallEventType),
			default: CallEventType.ATTEMPT
		},
		link: {
			type: 'string',
			ref: 'links',
			maxLength: 50
		},
		talent: {
			type: 'string',
			ref: 'talents',
			maxLength: 50
		}
	},
	required: ['_id', 'link', 'createdAt', 'type', 'talent']
} as const;

type CallEventRef = {
	link_?: Promise<LinkDocument>;
};

export const CallEventString = 'callEvent';

const schemaTyped = toTypedRxJsonSchema(CallEventSchemaLiteral);
export type CallEventDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const callEventSchema: RxJsonSchema<CallEventDocType> = CallEventSchemaLiteral;
export type CallEventDocument = RxDocument<CallEventDocType> & CallEventRef;
export type CallEventCollection = RxCollection<CallEventDocType>;

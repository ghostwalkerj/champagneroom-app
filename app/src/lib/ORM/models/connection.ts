import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import type { LinkDocument } from './link';

export enum ConnectionStatus {
	ATTEMPT,
	CONNECT,
	DISCONNECTED,
	NO_ANSWER,
	CALLER_HANGUP,
	CALLEE_HANGUP
}

const connectionSchemaLiteral = {
	title: 'connection',
	description: 'connection for a link',
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
			default: 'connection',
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
		status: {
			type: 'string',
			enum: Object.values(ConnectionStatus),
			default: ConnectionStatus.ATTEMPT
		},
		link: {
			type: 'string',
			ref: 'links',
			maxLength: 50
		}
	},
	required: ['_id', 'link', 'createdAt', 'status']
} as const;

type connectionRef = {
	link_?: Promise<LinkDocument>;
};

export const ConnectionString = 'connection';

const schemaTyped = toTypedRxJsonSchema(connectionSchemaLiteral);
export type ConnectionDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const connectionSchema: RxJsonSchema<ConnectionDocType> = connectionSchemaLiteral;
export type ConnectionDocument = RxDocument<ConnectionDocType> & connectionRef;
export type ConnectionCollection = RxCollection<ConnectionDocType>;

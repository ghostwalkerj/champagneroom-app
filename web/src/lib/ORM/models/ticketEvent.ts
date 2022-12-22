import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxCollection,
	type RxDocument,
	type RxJsonSchema
} from 'rxdb';
import type { TalentDocument } from './talent';
import type { TicketDocument } from './ticket';
import type { ShowDocument } from './show';

export enum TicketEventType {
	ATTEMPT,
	JOINED,
	LEFT
}

const TicketEventSchemaLiteral = {
	title: 'ticketEvent',
	description: 'ticketEvent for a ticket',
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
			default: 'ticketEvent',
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
			enum: Object.values(TicketEventType),
		},
		show: {
			type: 'string',
			ref: 'ticket',
			maxLength: 50
		},
		talent: {
			type: 'string',
			ref: 'talents',
			maxLength: 50
		},
		ticket: {
			type: 'string',
			ref: 'tickets',
			maxLength: 50
		},
	},
	required: ['_id', 'ticket', 'createdAt', 'type', 'talent', 'show']
} as const;

type TicketEventRef = {
	ticket_?: Promise<TicketDocument>;
	talent_?: Promise<TalentDocument>;
	show_?: Promise<ShowDocument>;
};

export const TicketEventString = 'ticketEvent';

const schemaTyped = toTypedRxJsonSchema(TicketEventSchemaLiteral);
export type TicketEventDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const ticketEventSchema: RxJsonSchema<TicketEventDocType> = TicketEventSchemaLiteral;
export type TicketEventDocument = RxDocument<TicketEventDocType> & TicketEventRef;
export type TicketEventCollection = RxCollection<TicketEventDocType>;

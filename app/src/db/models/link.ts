import urlJoin from 'url-join';
import validator from 'validator';
import { z } from 'zod';
import { DocumentBase } from '.';

export enum LinkStatus {
	ACTIVE = 'ACTIVE',
	EXPIRED = 'EXPIRED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED'
}
export const linkSchema = z.object({
	creatorId: z.string().min(21),
	walletAddress: z.string().refine((x) => {
		return validator.isEthereumAddress(x);
	}),
	amount: z.string().refine(
		(x) => {
			return validator.isInt(x, { gt: 0, lt: 10000 });
		},
		{ message: 'Must be between  $1 and $9999' }
	),
	fundedAmount: z.string().refine((x) => {
		return validator.isInt(x, { min: 0 });
	}),
	createdAt: z
		.string()
		.optional()
		.default(new Date().toISOString())
		.refine((x) => {
			return validator.isDate(x);
		}),
	callStart: z
		.string()
		.optional()
		.refine((x) => {
			return !x || validator.isDate(x);
		}),
	callEnd: z
		.string()
		.optional()
		.refine((x) => {
			return !x || validator.isDate(x);
		}),
	callId: z.string().min(21),
	status: z.nativeEnum(LinkStatus).default(LinkStatus.ACTIVE)
});

export type LinkType = z.infer<typeof linkSchema>;

export class LinkDocument extends DocumentBase {
	public expired = false;
	constructor() {
		super('link');
	}
}
export type LinkDocumentType = LinkDocument & LinkType;

export const generateLinkURL = (linkDocument: LinkDocument): string => {
	const TXN_URL = import.meta.env.VITE_TXN_URL || 'http://localhost:3000/txn';

	const url = new URL(urlJoin(TXN_URL, linkDocument._id));
	return url.toString();
};

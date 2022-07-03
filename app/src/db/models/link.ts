import urlJoin from 'url-join';
import validator from 'validator';
import { z } from 'zod';
import { DocumentBase } from '.';
export const linkSchema = z.object({
	name: z
		.string()
		.min(3, { message: 'Must be 3 or more characters long' })
		.max(20, { message: 'Must be 20 characters or less' }),
	amount: z.string().refine(
		(x) => {
			return validator.isInt(x, { gt: 0, lt: 10000 });
		},
		{ message: 'Must be between  $1 and $9999' }
	),
	address: z.string().refine(validator.isEthereumAddress),
	expired: z.boolean().optional().default(false),
	created_at: z.string().optional().default(new Date().toISOString()),
	creatorId: z.string().min(21)
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

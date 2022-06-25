import urlJoin from 'url-join';
import IsEthereumAddress from 'validator/lib/isEthereumAddress';
import { z } from 'zod';
import { DocumentBase } from '.';
export const linkSchema = z.object({
	name: z
		.string()
		.min(3, { message: 'Must be 3 or more characters long' })
		.max(20, { message: 'Must be 20 characters or less' }),
	amount: z.number().min(1).max(10000).int(),
	address: z.string().refine(IsEthereumAddress),
	expired: z.boolean().optional().default(false),
	created_at: z.string().optional().default(new Date().toISOString())
});

export type LinkType = z.infer<typeof linkSchema>;

export class LinkDocument extends DocumentBase implements LinkType {
	constructor() {
		super('link');
		(this as LinkType).expired = false;
	}
}
export type LinkDocumentType = LinkDocument & LinkType;

export const generateLinkURL = (linkDocument: LinkDocument): string => {
	const TXN_URL = import.meta.env.VITE_TXN_URL || 'http://localhost:3000/txn';

	const url = new URL(urlJoin(TXN_URL, linkDocument._id));
	return url.toString();
};

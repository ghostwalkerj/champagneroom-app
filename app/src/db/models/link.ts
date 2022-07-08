import { PCALL_ROOM_URL } from 'lib/constants';
import urlJoin from 'url-join';
import validator from 'validator';
import { z } from 'zod';
import { createModelBase, type ModelBase } from './modelBase';

export enum LinkStatus {
	ACTIVE = 'ACTIVE',
	EXPIRED = 'EXPIRED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED'
}
export const LinkSchema = z.object({
	talentId: z.string().min(21),
	walletAddress: z
		.string()
		.refine((x) => validator.isEthereumAddress(x), { message: 'Invalid Wallet Address' })
		.optional(),
	amount: z.string().refine((x) => validator.isInt(x, { gt: 0, lt: 10000 }), {
		message: 'Must be between  $1 and $9999'
	}),
	fundedAmount: z
		.string()
		.refine((x) => validator.isInt(x, { min: 0 }))
		.optional(),
	callStart: z
		.string()
		.refine((x) => validator.isDate(x))
		.optional(),
	callEnd: z
		.string()
		.refine((x) => validator.isDate(x))
		.optional(),
	callId: z.string().optional(),
	status: z.nativeEnum(LinkStatus).default(LinkStatus.ACTIVE).optional(),
	feedBackAvg: z.number().min(1).max(5).optional()
});

export type LinkBase = z.infer<typeof LinkSchema>;
export type Link = LinkBase & ModelBase;

export const LinkType = 'link';
export const LinkById = LinkType;

export const createLink = (_link: LinkBase) => {
	const base = createModelBase(LinkType);
	const link = {
		...base,
		..._link,
		status: LinkStatus.ACTIVE,
		fundedAmount: '0'
	};
	return link;
};

export const generateLinkURL = (linkDocument: Link): string => {
	const url = urlJoin(PCALL_ROOM_URL, linkDocument._id);
	return url;
};

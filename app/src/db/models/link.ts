import { PCALL_ROOM_URL } from 'lib/constants';
import urlJoin from 'url-join';
import { v4 as uuidv4 } from 'uuid';
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
export const LinkById = LinkType + 'ById';

export const createLink = (_link: LinkBase) => {
	const base = createModelBase(LinkType);
	const link = {
		...base,
		..._link,
		status: LinkStatus.ACTIVE,
		fundedAmount: '0',
		walletAddress: '0x251281e1516e6E0A145d28a41EE63BfcDd9E18Bf', //TODO: make real wallet
		callId: uuidv4()
	};
	return link;
};

export const generateLinkURL = (link: Link): string => {
	if (link && link._id) {
		const url = urlJoin(PCALL_ROOM_URL, link._id);
		return url;
	} else {
		console.log("Can't generate link url, link is missing id", link);
		return '';
	}
};

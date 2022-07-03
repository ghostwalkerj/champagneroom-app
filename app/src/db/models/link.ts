import { nanoid } from 'nanoid';
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
export const LinkSchema = z.object({
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
	status: z.nativeEnum(LinkStatus).default(LinkStatus.ACTIVE),
	feedBack: z
		.string()
		.optional()
		.refine((x) => {
			return !x || validator.isInt(x, { min: 0, max: 5 });
		})
});

export type LinkType = z.infer<typeof LinkSchema>;

export class LinkDocument extends DocumentBase implements LinkType {
	public status = LinkStatus.ACTIVE;
	public callId: string;
	public creatorId: string;

	public walletAddress: string;
	public amount: string;

	public fundedAmount: string;

	public callStart?: string;
	public callEnd?: string;

	public static type = 'link';

	constructor(creatorId: string, walletAddress: string, amount: string) {
		super(LinkDocument.type);
		this.creatorId = creatorId;
		this.walletAddress = walletAddress;
		this.amount = amount;
		this.fundedAmount = '0';
		this.callId = 'callId:' + nanoid();
	}
}
export const generateLinkURL = (linkDocument: LinkDocument): string => {
	const ROOM_URL = import.meta.env.VITE_ROOM_URL || 'http://localhost:3000/room';

	const url = new URL(urlJoin(ROOM_URL, linkDocument._id));
	return url.toString();
};

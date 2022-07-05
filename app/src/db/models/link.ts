import { PCALL_ROOM_URL } from 'lib/constants';
import urlJoin from 'url-join';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
import { z } from 'zod';
import { CreatorSchema, type CreatorDocument } from './creator';
import { DocumentBase } from './documentBase';

export enum LinkStatus {
	ACTIVE = 'ACTIVE',
	EXPIRED = 'EXPIRED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED'
}
export const LinkSchema = z.object({
	creatorId: z.string().min(21),
	walletAddress: z
		.string()
		.refine((x) => {
			return validator.isEthereumAddress(x);
		})
		.optional(),
	amount: z.string().refine(
		(x) => {
			return validator.isInt(x, { gt: 0, lt: 10000 });
		},
		{ message: 'Must be between  $1 and $9999' }
	),
	fundedAmount: z
		.string()
		.refine((x) => {
			return validator.isInt(x, { min: 0 });
		})
		.optional(),
	callStart: z
		.string()
		.refine((x) => {
			return validator.isDate(x);
		})
		.optional(),
	callEnd: z
		.string()
		.refine((x) => {
			return validator.isDate(x);
		})
		.optional(),
	callId: z.string().optional(),
	status: z.nativeEnum(LinkStatus).default(LinkStatus.ACTIVE).optional(),
	feedBack: z
		.string()
		.refine((x) => {
			return validator.isInt(x, { min: 0, max: 5 });
		})
		.optional(),
	creator: CreatorSchema.optional()
});

export type LinkType = z.infer<typeof LinkSchema>;

export class LinkDocument extends DocumentBase implements LinkType {
	public status = LinkStatus.ACTIVE;
	public callId: string;
	public creatorId: string;

	public walletAddress?: string;
	public amount: string;

	public fundedAmount: string;

	public callStart?: string;
	public callEnd?: string;

	public creator?: CreatorDocument;

	public static type = 'link';

	constructor(creatorId: string, walletAddress: string, amount: string) {
		super(LinkDocument.type);
		this.creatorId = creatorId;
		this.walletAddress = walletAddress;
		this.amount = amount;
		this.fundedAmount = '0';
		this.callId = uuidv4();
	}
}
export const generateLinkURL = (linkDocument: LinkDocument): string => {
	const url = urlJoin(PCALL_ROOM_URL, linkDocument._id);
	return url;
};

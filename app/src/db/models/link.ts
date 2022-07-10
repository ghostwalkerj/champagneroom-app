import { PCALL_ROOM_URL } from 'lib/constants';
import urlJoin from 'url-join';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import { createModelBase, type ModelBase } from './modelBase';

export enum LinkStatus {
	ACTIVE = 'ACTIVE',
	EXPIRED = 'EXPIRED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED'
}
export const LinkSchema = yup.object({
	talentId: yup.string().min(21).required(),
	walletAddress: yup.string(),
	amount: yup
		.string()
		.matches(/^[1-9]\d{0,3}$/, 'Must be between $1 and $9999')
		.required(),
	fundedAmount: yup
		.string()
		.matches(/^[0-9]\d*$/)
		.default('0'),
	callStart: yup.string(),
	callEnd: yup.string(),
	callId: yup.string(),
	status: yup.string().default(LinkStatus.ACTIVE),
	name: yup.string().min(3).max(20).required(),
	profileImageUrl: yup.string()
});

export type LinkBase = yup.InferType<typeof LinkSchema>;
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

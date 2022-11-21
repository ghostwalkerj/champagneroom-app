import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$env/static/private';
import { createLinkMachineService } from '$lib/machines/linkMachine';
import { apiDB } from '$lib/ORM/dbs/apiDB';
import { publicDB } from '$lib/ORM/dbs/publicDB';
import type { LinkDocType, LinkDocument } from '$lib/ORM/models/link';
import { TransactionReasonType } from '$lib/ORM/models/transaction';
import { StorageTypes } from '$lib/ORM/rxdb';
import { mensNames } from '$lib/util/mensNames';
import { error, invalid } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { uniqueNamesGenerator } from 'unique-names-generator';
type LinkStateType = LinkDocType['linkState'];

export const load: import('./$types').PageServerLoad = async ({ params }) => {
	const linkId = params.id;
	if (linkId === null) {
		throw error(404, 'pCall not found');
	}

	// Because we are returning the token to the client, we only allow access to the public database
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
			sub: JWT_PUBLIC_USER
		},
		JWT_SECRET //TODO: Need to change this to one specific to the public database
	);

	const db = await publicDB(token, linkId, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}

	const _link = await db.links.findOne(linkId).exec();

	if (!_link) {
		throw error(404, 'pCall not found');
	}

	const link = _link.toJSON() as LinkDocType;

	const displayName = uniqueNamesGenerator({
		dictionaries: [mensNames]
	});

	return {
		token,
		link,
		displayName
	};
};

const getLink = async (linkId: string) => {
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
			sub: JWT_CREATOR_USER
		},
		JWT_SECRET
	);

	const db = await apiDB(token, linkId, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}

	const link = await db.links.findOne(linkId).exec();
	if (!link) {
		throw error(404, 'Link not found');
	}

	return link;
};

export const actions: import('./$types').Actions = {
	claim: async ({ params, request }) => {
		const linkId = params.id;
		const data = await request.formData();
		const caller = data.get('caller') as string;
		const pin = data.get('pin') as string;

		if (!caller) {
			return invalid(400, { caller, missingCaller: true });
		}
		if (!pin) {
			return invalid(400, { pin, missingPin: true });
		}
		const isNum = /^\d+$/.test(pin);
		if (!isNum) {
			return invalid(400, { pin, invalidPin: true });
		}

		const claim = {
			caller,
			pin,
			createdAt: new Date().getTime(),
			call: {}
		} as NonNullable<LinkStateType['claim']>;

		const link = await getLink(linkId);

		let linkService = createLinkMachineService(link.linkState, link.updateLinkStateCallBack());

		link.get$('linkState').subscribe((_linkState) => {
			linkService = createLinkMachineService(_linkState, link.updateLinkStateCallBack());
		});

		const state = linkService.getSnapshot();
		if (
			!state.can({
				type: 'CLAIM',
				claim
			})
		) {
			return error(400, 'Link cannot be claimed');
		}

		linkService.send({
			type: 'CLAIM',
			claim
		});

		return { success: true };
	},
	send_payment: async ({ params, request }) => {
		const linkId = params.id;
		const data = await request.formData();
		const amount = data.get('amount') as string;

		if (!amount) {
			return invalid(400, { amount, missingAmount: true });
		}

		if (isNaN(Number(amount)) || Number(amount) < 1 || Number(amount) > 10000) {
			return invalid(400, { amount, invalidAmount: true });
		}

		const link = await getLink(linkId);

		let linkService = createLinkMachineService(link.linkState, link.updateLinkStateCallBack());

		link.get$('linkState').subscribe((_linkState) => {
			linkService = createLinkMachineService(_linkState, link.updateLinkStateCallBack());
		});

		const state = linkService.getSnapshot();
		if (!state.matches('claimed.waiting4Funding')) {
			return error(400, 'Link cannot be funded');
		}

		// Create and save a faux transaction
		const transaction = await link.createTransaction({
			hash: '0x1234567890',
			block: 1234567890,
			from: '0x1234567890',
			to: link.fundingAddress,
			value: amount,
			reason: TransactionReasonType.FUNDING
		});

		linkService.send({
			type: 'PAYMENT RECEIVED',
			transaction
		});

		return { success: true };
	},
	feedback: async ({ params, request }) => {
		const linkId = params.id;
		const data = await request.formData();
		const ratingStr = data.get('rating') as string;
		const comment = data.get('comment') as string;

		if (!ratingStr) {
			return invalid(400, { rating: ratingStr, missingRating: true });
		}
		const isNum = /^\d+$/.test(ratingStr);
		if (!isNum) {
			return invalid(400, { rating: ratingStr, invalidRating: true });
		}
		const rating = Number(ratingStr);
		if (rating < 1 || rating > 5) {
			return invalid(400, { rating: ratingStr, invalidRating: true });
		}

		const feedback = {
			rating,
			comment: comment.trim() || '',
			createdAt: new Date().getTime()
		} as NonNullable<LinkStateType['feedback']>;

		const link = await getLink(linkId);

		let linkService = createLinkMachineService(link.linkState, link.updateLinkStateCallBack());

		link.get$('linkState').subscribe((_linkState) => {
			linkService = createLinkMachineService(_linkState, link.updateLinkStateCallBack());
		});

		const state = linkService.getSnapshot();
		if (
			!state.can({
				type: 'FEEDBACK RECEIVED',
				feedback
			})
		) {
			return error(500, 'Feedback is not allowed');
		}

		linkService.send({
			type: 'FEEDBACK RECEIVED',
			feedback
		});

		return { success: true, rating };
	}
};

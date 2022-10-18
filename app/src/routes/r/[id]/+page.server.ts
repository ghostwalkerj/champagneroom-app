import { JWT_EXPIRY, JWT_CREATOR_USER, JWT_SECRET, JWT_PUBLIC_USER } from '$env/static/private';
import { createLinkMachineService } from '$lib/machines/linkMachine';
import { apiDB } from '$lib/ORM/dbs/apiDB';
import { publicDB } from '$lib/ORM/dbs/publicDB';
import type { FeedbackDocType, FeedbackDocument } from '$lib/ORM/models/feedback';
import type { LinkDocType, LinkDocument } from '$lib/ORM/models/link';
import { TransactionReasonType } from '$lib/ORM/models/transaction';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error, invalid } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

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

	const _feedback = await _link.populate('feedback');
	if (!_feedback) {
		throw error(500, 'Feedback not found');
	}

	_feedback.update({ $inc: { viewed: 1 } }); // Increment view count
	const feedback = (_feedback as FeedbackDocument).toJSON() as FeedbackDocType;

	return {
		token,
		link,
		feedback
	};
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

		const claim = {
			caller,
			pin,
			createdAt: new Date().getTime()
		} as NonNullable<LinkDocument['state']['claim']>;

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
			return error(404, 'Link not found');
		}

		const updateLink = (linkState: LinkDocument['state']) => {
			link.update({
				$set: {
					updatedAt: new Date().getTime(),
					state: linkState
				}
			});
		};

		const linkService = createLinkMachineService(link.state, updateLink);
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
	payment_sent: async ({ params, request }) => {
		const linkId = params.id;
		const data = await request.formData();
		const amount = data.get('amount') as string;

		if (!amount) {
			return invalid(400, { amount, missingAmount: true });
		}

		if (isNaN(Number(amount))) {
			return invalid(400, { amount, invalidAmount: true });
		}

		// Imitate a transaction
		//TODO: This will become a real transaction sent from blockchain event
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
			return error(404, 'Link not found');
		}

		const updateLink = (linkState: LinkDocument['state']) => {
			link.update({
				$set: {
					updatedAt: new Date().getTime(),
					state: linkState
				}
			});
		};

		const linkService = createLinkMachineService(link.state, updateLink);
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
	}
};

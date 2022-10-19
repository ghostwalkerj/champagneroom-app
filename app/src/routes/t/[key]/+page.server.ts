import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_SECRET } from '$env/static/private';
import { createLinkMachineService } from '$lib/machines/linkMachine';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import { ActorType, LinkDocument } from '$lib/ORM/models/link';
import { TransactionReasonType } from '$lib/ORM/models/transaction';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error, invalid } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { PageServerLoad } from './$types';

const token = jwt.sign(
	{
		exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
		sub: JWT_CREATOR_USER
	},
	JWT_SECRET
);

const getTalent = async (key: string) => {
	const db = await talentDB(token, key, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}
	const talent = await db.talents.findOne().where('key').equals(key).exec();
	if (!talent) {
		throw error(404, 'Talent not found');
	}

	return talent;
};

export const load: PageServerLoad = async ({ params }) => {
	const key = params.key;

	if (key === null) {
		throw error(404, 'Key not found');
	}

	const _talent = await getTalent(key);
	const _currentLink = (await _talent.populate('currentLink')) as LinkDocument;
	const _completedCalls = (await _talent.populate('stats.completedCalls')) as LinkDocument[];
	const talent = _talent.toJSON();
	const currentLink = _currentLink ? _currentLink.toJSON() : {};
	const completedCalls = _completedCalls.map((link) => link.toJSON());

	return {
		token,
		talent,
		currentLink,
		completedCalls
	};
};

export const actions: import('./$types').Actions = {
	create_link: async ({ params, request }) => {
		const key = params.key;
		if (key === null) {
			throw error(404, 'Key not found');
		}
		const data = await request.formData();
		const amount = data.get('amount') as string;

		if (!amount) {
			return invalid(400, { amount, missingAmount: true });
		}
		if (isNaN(Number(amount)) || Number(amount) < 0 || Number(amount) > 10000) {
			return invalid(400, { amount, invalidAmount: true });
		}
		const talent = await getTalent(key);

		talent.createLink(Number(amount));
		return { success: true };
	},
	cancel_link: async ({ params }) => {
		const key = params.key;
		if (key === null) {
			throw error(404, 'Key not found');
		}

		const talent = await getTalent(key);
		const cancelLink = (await talent.populate('currentLink')) as LinkDocument;
		if (!cancelLink) {
			throw error(404, 'Link not found');
		}

		const updateLink = (linkState: LinkDocument['state']) => {
			cancelLink.atomicPatch({
				updatedAt: new Date().getTime(),
				state: linkState
			});
		};
		const linkService = createLinkMachineService(cancelLink.state, updateLink);
		const currentLinkState = linkService.getSnapshot();

		linkService.send({
			type: 'REQUEST CANCELLATION',
			cancel: {
				createdAt: new Date().getTime(),
				canceledInState: JSON.stringify(currentLinkState.value),
				canceler: ActorType.TALENT
			}
		});
		return { success: true };
	},
	send_refund: async ({ params, request }) => {
		const key = params.key;
		if (key === null) {
			throw error(404, 'Key not found');
		}
		const data = await request.formData();
		const amount = data.get('amount') as string;

		if (!amount) {
			return invalid(400, { amount, missingAmount: true });
		}

		if (isNaN(Number(amount))) {
			return invalid(400, { amount, invalidAmount: true });
		}

		const talent = await getTalent(key);
		const refundLink = (await talent.populate('currentLink')) as LinkDocument;
		if (!refundLink) {
			throw error(404, 'Link not found');
		}

		const updateLink = (linkState: LinkDocument['state']) => {
			refundLink.update({
				$set: {
					updatedAt: new Date().getTime(),
					state: linkState
				}
			});
		};

		const linkService = createLinkMachineService(refundLink.state, updateLink);
		const state = linkService.getSnapshot();

		if (!state.matches('claimed.requestedCancellation.waiting4Refund')) {
			return error(400, 'Link cannot be refunded');
		}

		// Create and save a faux transaction
		const transaction = await refundLink.createTransaction({
			hash: '0x1234567890',
			block: 1234567890,
			to: '0x1234567890',
			from: refundLink.fundingAddress,
			value: amount,
			reason: TransactionReasonType.REFUND
		});

		linkService.send({
			type: 'REFUND RECEIVED',
			transaction
		});

		return { success: true };
	}
};

import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_SECRET } from '$env/static/private';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import type { ShowDocument } from '$lib/ORM/models/show';
import { StorageTypes } from '$lib/ORM/rxdb';
import { createShowMachineService } from '$lib/machines/showMachine';
import { error, fail } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { PageServerLoad } from './$types';

const token = jwt.sign(
	{
		exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
		sub: JWT_CREATOR_USER
	},
	JWT_SECRET
);

const getDb = async (key: string) => {
	const db = await talentDB(token, key, StorageTypes.NODE_WEBSQL);
	return db;
};

const getTalent = async (key: string) => {
	const db = await getDb(key);
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
	await _talent.updateStats();
	const _currentShow = (await _talent.populate('currentShow')) as ShowDocument;
	const _completedShows = (await _talent.populate('stats.completedShows')) as ShowDocument[];
	const talent = _talent.toJSON();
	const currentShow = _currentShow ? _currentShow.toJSON() : undefined;
	const completedShows = _completedShows.map((link) => link.toJSON());

	return {
		token,
		talent,
		currentShow,
		completedShows
	};
};

export const actions: import('./$types').Actions = {
	create_show: async ({ params, request }) => {
		const key = params.key;
		if (key === null) {
			throw error(404, 'Key not found');
		}
		const data = await request.formData();
		const price = data.get('amount') as string;
		const name = data.get('name') as string;
		const duration = data.get('duration') as string;
		const maxNumTickets = data.get('maxNumTickets') as string;

		if (!price) {
			return fail(400, { price, missingPrice: true });
		}
		if (isNaN(Number(price)) || Number(price) < 1 || Number(price) > 10000) {
			return fail(400, { price, invalidPrice: true });
		}

		if (!name) {
			return fail(400, { name, missingName: true });
		}

		if (!duration) {
			return fail(400, { duration, missingDuration: true });
		}
		if (isNaN(Number(duration)) || Number(duration) < 1 || Number(duration) > 360) {
			return fail(400, { duration, invalidDuration: true });
		}

		if (!maxNumTickets) {
			return fail(400, { maxNumTickets, missingMaxNumTickets: true });
		}
		if (isNaN(Number(maxNumTickets)) || Number(maxNumTickets) < 1 || Number(maxNumTickets) > 1000) {
			return fail(400, { maxNumTickets, invalidMaxNumTickets: true });
		}

		const talent = await getTalent(key);
		talent.createShow(
			{
				name,
				price: Number(price),
				duration: Number(duration),
				maxNumTickets: Number(maxNumTickets)
			}
		);
		return { success: true };
	},
	cancel_show: async ({ params }) => {
		const key = params.key;
		if (key === null) {
			throw error(404, 'Key not found');
		}

		const talent = await getTalent(key);
		const cancelShow = (await talent.populate('currentShow')) as ShowDocument;
		if (!cancelShow) {
			throw error(404, 'Link not found');
		}

		const showService = createShowMachineService(
			cancelShow.showState,
			cancelShow.saveState(),
		);
		showService.send({
			type: 'REQUEST CANCELLATION',
		});
		return { success: true };
	},
	send_refunds: async ({ params }) => {
		const key = params.key;
		if (key === null) {
			throw error(404, 'Key not found');
		}

		const talent = await getTalent(key);
		const refundShow = (await talent.populate('currentShow')) as ShowDocument;
		if (!refundShow) {
			throw error(404, 'Show not found');
		}

		const showService = createShowMachineService(
			refundShow.showState,
			refundShow.saveState(),
		);
		const state = showService.getSnapshot();

		if (!state.matches('requestedCancellation.waiting4Refund')) {
			return error(400, 'Show cannot be refunded');
		}

		showService.send({
			type: 'REFUNDED',
		});

		return { success: true };
	}
};

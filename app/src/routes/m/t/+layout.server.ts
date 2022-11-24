import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_SECRET } from '$env/static/private';
import { PUBLIC_MOBILE_PATH, PUBLIC_TALENT_PATH } from '$env/static/public';
import { createLinkMachineService } from '$lib/machines/linkMachine';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import type { LinkDocument } from '$lib/ORM/models/link';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';
import type { LayoutServerLoad } from './$types';

// /** @type {import('./$types').LayoutServerLoad} */
// export function load({ locals }) {
// 	if (!locals.user) {
// 		throw redirect(307, '/login');
// 	}
// }

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

export const load: LayoutServerLoad = async ({ url, params }) => {
	const key = params.key;

	if (key === undefined) {
		throw error(404, 'Key not found');
	}

	const _talent = await getTalent(key);
	await _talent.updateStats();
	const _currentLink = (await _talent.populate('currentLink')) as LinkDocument;
	const _completedCalls = (await _talent.populate('stats.completedCalls')) as LinkDocument[];
	const talent = _talent.toJSON();
	const currentLink = _currentLink ? _currentLink.toJSON() : undefined;
	const completedCalls = _completedCalls.map((link) => link.toJSON());

	return {
		token,
		talent,
		currentLink,
		completedCalls
	};
};

import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_SECRET } from '$env/static/private';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import type { LinkDocument } from '$lib/ORM/models/link';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const key = params.key;

	if (key === null) {
		throw error(404, 'Key not found');
	}

	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
			sub: JWT_CREATOR_USER
		},
		JWT_SECRET
	);

	const db = await talentDB(token, key, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}
	const _talent = await db.talents.findOne().where('key').equals(key).exec();
	if (!_talent) {
		throw error(404, 'Talent not found');
	}
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

import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_SECRET } from '$lib/constants';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const key = params.key;
	let token = '';
	if (JWT_SECRET) {
		token = jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_CREATOR_USER
			},
			JWT_SECRET
		);
	}

	//Try to preload link
	if (key != null) {
		const db = await talentDB(token, key, StorageTypes.NODE_WEBSQL);
		if (db) {
			const _talent = await db.talents.findOne().where('key').equals(key).exec();

			if (_talent) {
				const _currentLink = await _talent.populate('currentLink');
				const currentLink = _currentLink ? _currentLink.toJSON() : null;
				const talent = _talent.toJSON();
				return { token, talent, currentLink };
			} else {
				return { token };
			}
		} else {
			throw error(400, 'no db');
		}
	}
};

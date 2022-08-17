import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_SECRET } from '$lib/constants';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import { StorageTypes } from '$lib/ORM/rxdb';
import jwt from 'jsonwebtoken';
export async function load({ params }) {
	const key = params.key;
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
			sub: JWT_CREATOR_USER
		},
		JWT_SECRET
	);

	//Try to preload link
	if (token != '') {
		const db = await talentDB(token, key, StorageTypes.NODE_WEBSQL);
		const _talent = await db.talents.findOne().where('key').equals(key).exec();

		if (_talent) {
			const _currentLink = await _talent.populate('currentLink');
			const currentLink = _currentLink ? _currentLink.toJSON() : null;
			const talent = _talent.toJSON();
			return { token, talent, currentLink };
		}
	}
}

import { JWT_EXPIRY, JWT_SECRET } from '$lib/constants';
import { StorageTypes } from '$lib/ORM/rxdb';
import jwt from 'jsonwebtoken';
import { JWT_CREATOR_USER } from '../../lib/constants';
import { talentDB } from '../../lib/ORM/dbs/talentDB';
export async function GET({ params }) {
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
		const talent = await db.talents.findOne().where('key').eq(key).exec();

		if (talent) {
			const currentLink = await talent.populate('currentLink');
			return {
				body: { token, talent: talent.toJSON(), currentLink: currentLink.toJSON() },
				status: 200
			};
		}
	}
}

import { JWT_EXPIRY, JWT_SECRET } from '$lib/constants';
import { StorageTypes } from '$lib/ORM/rxdb';
import jwt from 'jsonwebtoken';
import { JWT_CREATOR_USER } from '$lib/constants';
import { talentDB, thisCurrentLink, thisTalent } from '$lib/ORM/dbs/talentDB';
import { get } from 'svelte/store';
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
		await talentDB(token, key, StorageTypes.NODE_WEBSQL);
		const _talent = get(thisTalent);

		if (_talent) {
			const _currentLink = get(thisCurrentLink);
			const currentLink = _currentLink ? _currentLink.toJSON() : null;
			const talent = _talent.toJSON();
			return {
				body: { token, talent, currentLink },
				status: 200
			};
		}
	}
}

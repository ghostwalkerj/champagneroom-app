import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$lib/constants';
import { publicDB, thisFeedback, thisLink } from '$lib/ORM/dbs/publicDB';
import { StorageTypes } from '$lib/ORM/rxdb';
import jwt from 'jsonwebtoken';
import { get } from 'svelte/store';
export async function GET({ params }) {
	const linkId = params.id;
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
			sub: JWT_PUBLIC_USER
		},
		JWT_SECRET
	);

	//Try to preload link
	if (token != '') {
		await publicDB(token, linkId, StorageTypes.NODE_WEBSQL);
		const _link = get(thisLink);

		if (_link) {
			const link = _link.toJSON();
			const _feedback = get(thisFeedback);
			if (_feedback) {
				const feedback = _feedback.toJSON();
				return {
					body: { token, link, feedback },
					status: 200
				};
			} else {
				return {
					body: { token, link },
					status: 200
				};
			}
		}
	}
}

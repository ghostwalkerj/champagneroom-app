import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$lib/constants';
import { publicDB } from '$lib/ORM/dbs/publicDB';
import { StorageTypes } from '$lib/ORM/rxdb';
import jwt from 'jsonwebtoken';
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
		const db = await publicDB(token, linkId, StorageTypes.NODE_WEBSQL);
		const link = await db.links.findOne(linkId).exec();

		if (link) {
			return {
				body: { token, link: link.toJSON() },
				status: 200
			};
		}
	}
}

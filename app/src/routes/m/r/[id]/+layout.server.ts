import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$env/static/private';
import { publicDB } from '$lib/ORM/dbs/publicDB';
import type { LinkDocType } from '$lib/ORM/models/link';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

// /** @type {import('./$types').LayoutServerLoad} */
// export function load({ locals }) {
// 	if (!locals.user) {
// 		throw redirect(307, '/login');
// 	}
// }

export const load: import('./$types').PageServerLoad = async ({ params }) => {
	const linkId = params.id;
	if (linkId === null) {
		throw error(404, 'pCall not found');
	}

	// Because we are returning the token to the client, we only allow access to the public database
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
			sub: JWT_PUBLIC_USER
		},
		JWT_SECRET //TODO: Need to change this to one specific to the public database
	);

	const db = await publicDB(token, linkId, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}

	const _link = await db.links.findOne(linkId).exec();

	if (!_link) {
		throw error(404, 'pCall not found');
	}

	const link = _link.toJSON() as LinkDocType;

	return {
		token,
		link
	};
};

import { publicDB } from '$lib/ORM/dbs/publicDB';
import type { FeedbackDocument } from '$lib/ORM/models/feedback';
import { StorageTypes } from '$lib/ORM/rxdb';
import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$lib/util/constants';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const linkId = params.id;
	let token = '';
	if (JWT_SECRET) {
		token = jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_PUBLIC_USER
			},
			JWT_SECRET
		);
	}

	const db = await publicDB(token, linkId, StorageTypes.NODE_WEBSQL);
	if (db) {
		const _link = await db.links.findOne(linkId).exec();
		if (_link) {
			const link = _link.toJSON();
			const _feedback = (await _link.populate('feedback')) as FeedbackDocument;
			if (_feedback) {
				_feedback.update({ $inc: { viewed: 1 } }); // Increment view count
				const feedback = _feedback.toJSON();
				return { token, link, feedback };
			}
		}
	} else {
		throw error(400, 'no db');
	}
};

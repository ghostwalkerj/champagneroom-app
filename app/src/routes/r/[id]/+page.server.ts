import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$lib/constants';
import { publicDB } from '$lib/ORM/dbs/publicDB';
import type { FeedbackDocument } from '$lib/ORM/models/feedback';
import { StorageTypes } from '$lib/ORM/rxdb';
import jwt from 'jsonwebtoken';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	if (JWT_EXPIRY && JWT_SECRET && JWT_PUBLIC_USER) {
		const linkId = params.id;
		const token = jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_PUBLIC_USER
			},
			JWT_SECRET
		);

		if (token != '') {
			const db = await publicDB(token, linkId, StorageTypes.NODE_WEBSQL);
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
		}
	}
};

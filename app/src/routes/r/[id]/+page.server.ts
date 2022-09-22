import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$env/static/private';
import { publicDB } from '$lib/ORM/dbs/publicDB';
import type { FeedbackDocument } from '$lib/ORM/models/feedback';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const linkId = params.id;

	if (linkId === null) {
		throw error(404, 'pCall not found');
	}

	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
			sub: JWT_PUBLIC_USER
		},
		JWT_SECRET
	);

	const db = await publicDB(token, linkId, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}
	const _link = await db.links.findOne(linkId).exec();

	if (!_link) {
		throw error(404, 'pCall not found');
	}

	const link = _link.toJSON();
	const _feedback = await _link.populate('feedback');
	if (!_feedback) {
		throw error(500, 'Feedback not found');
	}
	_feedback.update({ $inc: { viewed: 1 } }); // Increment view count
	const feedback = (_feedback as FeedbackDocument).toJSON();

	return {
		token,
		link,
		feedback
	};
};

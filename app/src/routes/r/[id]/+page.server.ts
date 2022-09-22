import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$env/static/private';
import { publicDB } from '$lib/ORM/dbs/publicDB';
import type { FeedbackDocument } from '$lib/ORM/models/feedback';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const linkId = params.id;
	let token = '';
	let link = {};
	let feedback = {};
	if (JWT_SECRET) {
		token = jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
				sub: JWT_PUBLIC_USER
			},
			JWT_SECRET
		);
	}

	const db = await publicDB(token, linkId, StorageTypes.NODE_WEBSQL);
	if (db) {
		const _link = await db.links.findOne(linkId).exec();
		if (_link) {
			link = _link.toJSON();
			const _feedback = (await _link.populate('feedback')) as FeedbackDocument;
			if (_feedback) {
				_feedback.update({ $inc: { viewed: 1 } }); // Increment view count
				feedback = _feedback.toJSON();
			}
		}
		else {
			throw error(404, 'Link not found');
		}
	} else {
		throw error(500, 'no db');
	}

	return { token, link, feedback };

};

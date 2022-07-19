import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$lib/constants';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	let token = {};
	if (body.type && body.type === 'agent') {
		token = jwt.sign(
			{
				name: 'pcalluser'
			},
			JWT_SECRET
		);
	}

	return {
		body: { token: JSON.stringify(token) },
		status: 201
	};
};

import { JWT_AUDIENCE, JWT_SECRET } from '$lib/constants';
import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	let token = {};
	if (body.type && body.type === 'agent') {
		token = jwt.sign(
			{
				aud: JWT_AUDIENCE,
				//scope: 'agent',
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
			},
			JWT_SECRET
		);
	}
	return {
		body: { token },
		status: 201
	};
};

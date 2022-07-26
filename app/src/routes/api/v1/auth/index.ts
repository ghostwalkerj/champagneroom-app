import { JWT_EXPIRY, JWT_SECRET, JWT_USER } from '$lib/constants';
import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	let token = {};
	if (body.type && (body.type === 'agent' || body.type === 'talent')) {
		token = jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_USER
			},
			JWT_SECRET
		);
	}
	return {
		body: { token },
		status: 201
	};
};

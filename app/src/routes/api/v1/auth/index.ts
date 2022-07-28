import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_SECRET } from '$lib/constants';
import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { TokenRole } from '$lib/constants';
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const tokenRole = body.tokenRole;
	let token = {};
	if (tokenRole && (tokenRole === TokenRole.AGENT || tokenRole === TokenRole.TALENT)) {
		token = jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_CREATOR_USER
			},
			JWT_SECRET
		);
	}
	return {
		body: { token },
		status: 201
	};
};

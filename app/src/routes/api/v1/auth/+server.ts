import {
	JWT_CREATOR_USER,
	JWT_EXPIRY,
	JWT_PUBLIC_USER,
	JWT_SECRET,
	TokenRoles
} from '$lib/constants';
import { json as json$1 } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const tokenRole = body.tokenRole;
	let token = '';
	if (JWT_SECRET) {
		if (tokenRole && (tokenRole === TokenRoles.AGENT || tokenRole === TokenRoles.TALENT)) {
			token = jwt.sign(
				{
					exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
					sub: JWT_CREATOR_USER
				},
				JWT_SECRET
			);
		}
		if (tokenRole === TokenRoles.PUBLIC) {
			token = jwt.sign(
				{
					exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
					sub: JWT_PUBLIC_USER
				},
				JWT_SECRET
			);
		}
	}

	return json$1(
		{ token },
		{
			status: 201
		}
	);
};

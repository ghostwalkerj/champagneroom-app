import {
	JWT_CREATOR_USER,
	JWT_EXPIRY,
	JWT_PUBLIC_USER,
	JWT_SECRET,
	TokenRoles
} from '$lib/constants';
import jwt from 'jsonwebtoken';

export const doAuth = async (tokenRole: TokenRoles) => {
	if (tokenRole === TokenRoles.AGENT || tokenRole === TokenRoles.TALENT) {
		return jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_CREATOR_USER
			},
			JWT_SECRET
		);
	} else if (tokenRole === TokenRoles.PUBLIC) {
		return jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_PUBLIC_USER
			},
			JWT_SECRET
		);
	}
};
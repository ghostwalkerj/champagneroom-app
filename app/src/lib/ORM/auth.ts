import {
	JWT_CREATOR_USER,
	JWT_EXPIRY,
	JWT_PUBLIC_USER,
	JWT_SECRET,
	TokenRole
} from '$lib/constants';
import jwt from 'jsonwebtoken';

export const doAuth = async (tokenRole: TokenRole) => {
	if (tokenRole === TokenRole.AGENT || tokenRole === TokenRole.TALENT) {
		return jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_CREATOR_USER
			},
			JWT_SECRET
		);
	} else if (tokenRole === TokenRole.PUBLIC) {
		return jwt.sign(
			{
				exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
				sub: JWT_PUBLIC_USER
			},
			JWT_SECRET
		);
	}
};

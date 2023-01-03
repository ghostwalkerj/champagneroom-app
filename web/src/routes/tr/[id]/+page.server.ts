import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$env/static/private';
import { publicTicketDB } from '$lib/ORM/dbs/publicTicketDB';
import type { TicketDocType } from '$lib/ORM/models/ticket';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

export const load: import('./$types').PageServerLoad = async ({ params, cookies, url }) => {
	const ticketId = params.id;
	const pin = cookies.get('pin');
	const redirectUrl = urlJoin(url.href, 'pin');

	if (!pin) {
		throw redirect(307, redirectUrl);
	}
	if (ticketId === null) {
		throw error(404, 'Ticket not found');
	}

	// Because we are returning the token to the client, we only allow access to the public database
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
			sub: JWT_PUBLIC_USER
		},
		JWT_SECRET //TODO: Need to change this to one specific to the public database
	);

	const db = await publicTicketDB(token, ticketId, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}

	const _ticket = await db.tickets.findOne(ticketId).exec();

	if (!_ticket) {
		throw error(404, 'Ticket not found');
	}

	if (_ticket.ticketState.reservation.pin !== pin) {
		throw redirect(307, redirectUrl);
	}

	const ticket = _ticket.toJSON() as TicketDocType;

	return {
		token,
		ticket
	};
};

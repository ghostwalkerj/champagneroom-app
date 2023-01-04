import { JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$env/static/private';
import { PUBLIC_PIN_PATH } from '$env/static/public';
import { publicTicketDB } from '$lib/ORM/dbs/publicTicketDB';
import type { TicketDocType, TicketDocument } from '$lib/ORM/models/ticket';
import { StorageTypes } from '$lib/ORM/rxdb';
import { verifyPin } from '$lib/util/pin';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

export const load: import('./$types').PageServerLoad = async ({ params, cookies, url }) => {
	const ticketId = params.id;
	const pinHash = cookies.get('pin');
	const redirectUrl = urlJoin(url.href, PUBLIC_PIN_PATH);

	if (!pinHash) {
		throw redirect(303, redirectUrl);
	}
	if (ticketId === null) {
		throw error(404, 'Bad ticket id');
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

	const _ticket = await db.tickets.findOne(ticketId).exec() as TicketDocument;

	if (!_ticket) {
		throw error(404, 'Ticket not found');
	}

	const _show = await _ticket.show_;
	if (!_show) {
		throw error(404, 'Show not found');
	}

	if (!verifyPin(ticketId, _ticket.ticketState.reservation.pin, pinHash)) {
		throw redirect(303, redirectUrl);
	};

	const ticket = _ticket.toJSON() as TicketDocType;
	const show = _show.toJSON();

	return {
		token,
		ticket,
		show
	};
};

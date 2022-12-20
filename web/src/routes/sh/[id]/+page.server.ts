import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_PUBLIC_USER, JWT_SECRET } from '$env/static/private';
import { apiDB } from '$lib/ORM/dbs/apiDB';
import { publicShowDB } from '$lib/ORM/dbs/publicShowDB';
import type { ShowDocType } from '$lib/ORM/models/show';
import { StorageTypes } from '$lib/ORM/rxdb';
import { mensNames } from '$lib/util/mensNames';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { uniqueNamesGenerator } from 'unique-names-generator';

export const load: import('./$types').PageServerLoad = async ({ params }) => {
	const showId = params.id;
	if (showId === null) {
		throw error(404, 'Champagne Show not found');
	}

	// Because we are returning the token to the client, we only allow access to the public database
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
			sub: JWT_PUBLIC_USER
		},
		JWT_SECRET //TODO: Need to change this to one specific to the public database
	);

	const db = await publicShowDB(token, showId, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}

	const _show = await db.shows.findOne(showId).exec();

	if (!_show) {
		throw error(404, 'pCall not found');
	}

	const show = _show.toJSON() as ShowDocType;

	const displayName = uniqueNamesGenerator({
		dictionaries: [mensNames]
	});

	return {
		token,
		show,
		displayName
	};
};

const getShow = async (showId: string) => {
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
			sub: JWT_CREATOR_USER
		},
		JWT_SECRET
	);

	const db = await apiDB(token, showId, StorageTypes.NODE_WEBSQL);
	if (!db) {
		throw error(500, 'no db');
	}

	const show = await db.shows.findOne(showId).exec();
	if (!show) {
		throw error(404, 'Show not found');
	}

	return show;
};

export const actions: import('./$types').Actions = {

};

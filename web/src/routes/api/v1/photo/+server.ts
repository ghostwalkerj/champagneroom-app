import { JWT_CREATOR_USER, JWT_EXPIRY, JWT_SECRET, WEB3STORAGE_API_TOKEN, WEB3STORAGE_DOMAIN } from '$env/static/private';

import { json } from '@sveltejs/kit';
import { Web3Storage } from 'web3.storage';
import type { RequestHandler } from './$types';

import { talentDB } from '$lib/ORM/dbs/talentDB';
import { StorageTypes } from '$lib/ORM/rxdb';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { LinkDocument } from '$lib/ORM/models/link';

const client = new Web3Storage({ token: WEB3STORAGE_API_TOKEN });

const token = jwt.sign(
	{
		exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
		sub: JWT_CREATOR_USER
	},
	JWT_SECRET
);

const getDb = async (key: string) => {
	const db = await talentDB(token, key, StorageTypes.NODE_WEBSQL);
	return db;
};

const getTalent = async (key: string) => {
	const db = await getDb(key);
	if (!db) {
		throw error(500, 'no db');
	}
	const talent = await db.talents.findOne().where('key').equals(key).exec();
	if (!talent) {
		throw error(404, 'Talent not found');
	}

	return talent;
};

export const POST: RequestHandler = async ({ request }) => {
	let url = '';
	const body = await request.formData();
	const file = body.get('file') as File;
	const key = body.get('key') as string;
	if (file && key) {
		try {
			const rootCid = await client.put([file]);
			const res = await client.get(rootCid);
			// Web3Response
			if (res) {
				const files = await res.files(); // Web3File[]
				for (const file of files) {
					url = `https://${file.cid}.ipfs.${WEB3STORAGE_DOMAIN}`;
					break;
				}
			}

			const talent = await getTalent(key);
			talent.atomicPatch({
				profileImageUrl: url,
				updatedAt: new Date().getTime()
			});

			const currentLink = await talent.populate('currentLink') as LinkDocument;
			if (currentLink) {
				currentLink.atomicPatch({
					talentInfo: {
						...currentLink.talentInfo,
						profileImageUrl: url
					},
					updatedAt: new Date().getTime()
				});
			}

		} catch (error) {
			console.log('error', error);
		}
		return json({ url });
	} else {
		return new Response(undefined, { status: 400 });
	}
};

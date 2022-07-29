import { PUBLIC_ENDPOINT, RXDB_PASSWORD } from '$lib/constants';
import { initRXDB, StorageTypes } from '$lib/ORM/rxdb';
import { feedbackSchema, type FeedbackCollection } from '$lib/ORM/models/feedback';
import {
	linkDocMethods,
	linkSchema,
	type LinkCollection,
	type LinkDocument
} from '$lib/ORM/models/link';
import { createRxDatabase, removeRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';
import { writable } from 'svelte/store';

type PublicCollections = {
	links: LinkCollection;
	feedbacks: FeedbackCollection;
};

export type PublicDBType = RxDatabase<PublicCollections>;
let _publicDB: PublicDBType;

export const publicDB = async (token: string, linkId: string, storage: StorageTypes) =>
	_publicDB ? _publicDB : await _create(token, linkId, storage);

let _thisLink: LinkDocument | null;

const _create = async (token: string, linkId: string, storage: StorageTypes) => {
	initRXDB(storage);
	//await removeRxDatabase('public_db', getRxStoragePouch(storage));

	const _db: PublicDBType = await createRxDatabase({
		name: 'public_db',
		storage: getRxStoragePouch(storage),
		ignoreDuplicate: true,
		password: RXDB_PASSWORD
	});

	await _db.addCollections({
		links: {
			schema: linkSchema,
			methods: linkDocMethods
		},
		feedbacks: {
			schema: feedbackSchema
		}
	});
	const remoteDB = new PouchDB(PUBLIC_ENDPOINT, {
		fetch: function (
			url: string,
			opts: { headers: { set: (arg0: string, arg1: string) => void } }
		) {
			opts.headers.set('Authorization', 'Bearer ' + token);
			return PouchDB.fetch(url, opts);
		}
	});
	const query = _db.links.findOne(linkId);

	let repState = _db.links.syncCouchDB({
		remote: remoteDB,
		waitForLeadership: false,
		options: {
			retry: true
		},
		query
	});
	await repState.awaitInitialReplication();

	repState = _db.feedbacks.syncCouchDB({
		remote: remoteDB,
		waitForLeadership: false,
		options: {
			retry: true
		},
		query: _db.feedbacks.find().where('link').eq(linkId)
	});
	await repState.awaitInitialReplication();

	_thisLink = await query.exec();
	if (_thisLink) thisLink.set(_thisLink);

	_db.links.syncCouchDB({
		remote: remoteDB,
		waitForLeadership: true,
		options: {
			retry: true,
			live: true
		},
		query
	});
	_db.feedbacks.syncCouchDB({
		remote: remoteDB,
		waitForLeadership: true,
		options: {
			retry: true,
			live: true
		},
		query: _db.feedbacks.find().where('link').eq(linkId)
	});

	_publicDB = _db;
	thisPublicDB.set(_db);
	return _publicDB;
};

export const thisLink = writable<LinkDocument>();
export const thisPublicDB = writable<RxDatabase<PublicCollections>>();

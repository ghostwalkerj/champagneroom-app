import { PUBLIC_CREATORS_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';

import type { StorageTypes } from '$lib/ORM/rxdb';
import { initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import { type ShowCollection, type ShowDocument, createTicket, showSchema } from '$lib/ORM/models/show';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type APICollections = {
	shows: ShowCollection;
};

export type APIDBType = RxDatabase<APICollections>;
const _apiDB = new Map<string, APIDBType>();

export const apiDB = async (
	token: string,
	showId: string,
	storage: StorageTypes
): Promise<APIDBType> => await create(token, showId, storage);

let _thisShow: ShowDocument;

const create = async (token: string, showId: string, storage: StorageTypes) => {
	let _db = _apiDB.get(showId);
	if (_db) return _db;

	initRXDB(storage);

	const wrappedStorage = wrappedKeyEncryptionStorage({
		storage: getRxStoragePouch(storage)
	});

	_db = await createRxDatabase({
		name: 'pouchdb/api_db',
		storage: wrappedStorage,
		ignoreDuplicate: true,
		password: PUBLIC_RXDB_PASSWORD
	});

	await _db.addCollections({
		shows: {
			schema: showSchema,
			methods: createTicket
		}
	});

	if (PUBLIC_CREATORS_ENDPOINT) {
		// Sync if there is a remote endpoint
		const remoteDB = new PouchDB(PUBLIC_CREATORS_ENDPOINT, {
			fetch: function (
				url: string,
				opts: { headers: { set: (arg0: string, arg1: string) => void; }; }
			) {
				opts.headers.set('Authorization', 'Bearer ' + token);
				return PouchDB.fetch(url, opts);
			}
		});
		const showQuery = _db.shows.findOne(showId);

		const repState = _db.shows.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: showQuery
		});
		await repState.awaitInitialReplication();

		_thisShow = (await showQuery.exec()) as ShowDocument;
		if (_thisShow) {
			_db.shows.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: showQuery
			});
		}
	}
	_apiDB.set(showId, _db);
	return _db;
};

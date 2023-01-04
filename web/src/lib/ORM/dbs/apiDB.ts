import { PUBLIC_CREATORS_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';

import { showDocMethods, showSchema, type ShowCollection, type ShowDocument } from '$lib/ORM/models/show';
import { TicketCollection, ticketSchema } from '$lib/ORM/models/ticket';
import type { StorageTypes } from '$lib/ORM/rxdb';
import { initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type APICollections = {
	shows: ShowCollection;
	tickets: TicketCollection;
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
			methods: showDocMethods
		},
		tickets: {
			schema: ticketSchema
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
		const ticketQuery = _db.tickets.find().where('show').eq(showId);

		let repState = _db.shows.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: showQuery
		});
		await repState.awaitInitialReplication();

		repState = _db.tickets.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: ticketQuery
		});
		await repState.awaitInitialReplication();

		_thisShow = (await showQuery.exec()) as ShowDocument;

		if (_thisShow) {

			// Sync tickets
			_db.tickets.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: ticketQuery
			});

			// Sync shows
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

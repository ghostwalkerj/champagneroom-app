import { PUBLIC_PUBLIC_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import { StorageTypes, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';

import { showSchema, type ShowCollection, type ShowDocument } from '$lib/ORM/models/show';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type PublicCollections = {
	shows: ShowCollection;
};

export type PublicShowDBType = RxDatabase<PublicCollections>;
const _publicShowDB = new Map<string, PublicShowDBType>();
export const publicShowDB = async (
	token: string,
	showId: string,
	storage: StorageTypes
): Promise<PublicShowDBType> => await create(token, showId, storage);

let _thisShow: ShowDocument;

const create = async (token: string, showId: string, storage: StorageTypes) => {
	let _db = _publicShowDB.get(showId);
	if (_db) return _db;

	initRXDB(storage);

	const wrappedStorage = wrappedKeyEncryptionStorage({
		storage: getRxStoragePouch(storage)
	});

	_db = await createRxDatabase({
		name: 'pouchdb/cb_db',
		storage: wrappedStorage,
		ignoreDuplicate: true,
		password: PUBLIC_RXDB_PASSWORD
	});

	await _db.addCollections({
		shows: {
			schema: showSchema
		}
	});

	if (PUBLIC_PUBLIC_ENDPOINT) {
		// Sync if there is a remote endpoint
		const remoteDB = new PouchDB(PUBLIC_PUBLIC_ENDPOINT, {
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
	_publicShowDB.set(showId, _db);
	return _db;
};

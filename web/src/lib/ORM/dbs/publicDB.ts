import { PUBLIC_PUBLIC_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import { linkSchema, type LinkCollection, type LinkDocument } from '$lib/ORM/models/link';
import { initRXDB, StorageTypes } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';

import { getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type PublicCollections = {
	links: LinkCollection;
};

export type PublicDBType = RxDatabase<PublicCollections>;
const _publicDB = new Map<string, PublicDBType>();
export const publicDB = async (
	token: string,
	linkId: string,
	storage: StorageTypes
): Promise<PublicDBType> => await create(token, linkId, storage);

let _thisLink: LinkDocument;

const create = async (token: string, linkId: string, storage: StorageTypes) => {
	let _db = _publicDB.get(linkId);
	if (_db) return _db;

	initRXDB(storage);

	const wrappedStorage = wrappedKeyEncryptionStorage({
		storage: getRxStoragePouch(storage)
	});

	_db = await createRxDatabase({
		name: 'pouchdb/public_db',
		storage: wrappedStorage,
		ignoreDuplicate: true,
		password: PUBLIC_RXDB_PASSWORD
	});

	await _db.addCollections({
		links: {
			schema: linkSchema
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
		const linkQuery = _db.links.findOne(linkId);

		const repState = _db.links.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: linkQuery
		});
		await repState.awaitInitialReplication();

		_thisLink = (await linkQuery.exec()) as LinkDocument;
		if (_thisLink) {
			_db.links.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: linkQuery
			});
		}
	}
	_publicDB.set(linkId, _db);
	return _db;
};

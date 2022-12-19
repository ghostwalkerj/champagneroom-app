import { PUBLIC_CREATORS_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import {
	linkDocMethods,
	linkSchema,
	type LinkCollection,
	type LinkDocument
} from '$lib/ORM/models/link';
import { transactionSchema, type TransactionCollection } from '$lib/ORM/models/transaction';
import type { StorageTypes } from '$lib/ORM/rxdb';
import { initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import { callEventSchema, type CallEventCollection } from '../models/callEvent';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type APICollections = {
	links: LinkCollection;
	callEvents: CallEventCollection;
	transactions: TransactionCollection;
};

export type APIDBType = RxDatabase<APICollections>;
const _apiDB = new Map<string, APIDBType>();

export const apiDB = async (
	token: string,
	linkId: string,
	storage: StorageTypes
): Promise<APIDBType> => await create(token, linkId, storage);

let _thisLink: LinkDocument;

const create = async (token: string, linkId: string, storage: StorageTypes) => {
	let _db = _apiDB.get(linkId);
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
		links: {
			schema: linkSchema,
			methods: linkDocMethods
		},
		callEvents: {
			schema: callEventSchema
		},
		transactions: {
			schema: transactionSchema
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
		const linkQuery = _db.links.findOne(linkId);

		let repState = _db.links.syncCouchDB({
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
			const transactionQuery = _db.transactions.findOne().where('link').eq(linkId);
			const callEventsQuery = _db.callEvents.findOne().where('link').eq(linkId);

			repState = _db.transactions.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true
				},
				query: transactionQuery
			});
			await repState.awaitInitialReplication();

			repState = _db.callEvents.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true
				},
				query: callEventsQuery
			});
			await repState.awaitInitialReplication();

			_db.links.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: linkQuery
			});

			_db.transactions.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: transactionQuery
			});

			_db.callEvents.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: callEventsQuery
			});
		}
	}
	_apiDB.set(linkId, _db);
	return _db;
};

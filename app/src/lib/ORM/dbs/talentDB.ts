import { PUBLIC_CREATORS_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import { linkDocMethods, linkSchema, type LinkCollection } from '$lib/ORM/models/link';
import { talentDocMethods, talentSchema, type TalentCollection } from '$lib/ORM/models/talent';
import { transactionSchema, type TransactionCollection } from '$lib/ORM/models/transaction';
import type { StorageTypes } from '$lib/ORM/rxdb';
import { initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';
import { callEventSchema, type CallEventCollection } from '../models/callEvent';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type CreatorsCollections = {
	talents: TalentCollection;
	links: LinkCollection;
	callEvents: CallEventCollection;
	transactions: TransactionCollection;
};

export type TalentDBType = RxDatabase<CreatorsCollections>;
const _talentDB = new Map<string, TalentDBType>();

export const talentDB = async (token: string, key: string, storage: StorageTypes) =>
	await create(token, key, storage);

const create = async (token: string, key: string, storage: StorageTypes) => {
	let _db = _talentDB.get(key);
	if (_db) return _db;
	initRXDB(storage);

	const wrappedStorage = wrappedKeyEncryptionStorage({
		storage: getRxStoragePouch(storage)
	});

	_db = await createRxDatabase({
		name: 'pouchdb/talent_db',
		storage: wrappedStorage,
		ignoreDuplicate: true,
		password: PUBLIC_RXDB_PASSWORD
	});

	await _db.addCollections({
		talents: {
			schema: talentSchema,
			methods: talentDocMethods
		},
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
				opts: { headers: { set: (arg0: string, arg1: string) => void } }
			) {
				opts.headers.set('Authorization', 'Bearer ' + token);
				return PouchDB.fetch(url, opts);
			}
		});
		const talentQuery = _db.talents.findOne().where('key').eq(key);
		const _currentTalent = await talentQuery.exec();

		const linkQuery = _db.links.find().where('talent').eq(_currentTalent?._id);
		const callEventQuery = _db.callEvents.find().where('talent').eq(_currentTalent?._id);
		const transactionQuery = _db.transactions.find().where('talent').eq(_currentTalent?._id);

		let repState = _db.talents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: talentQuery
		});
		await repState.awaitInitialReplication();

		if (_currentTalent) {
			// Wait for links
			repState = _db.links.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true
				},
				query: linkQuery
			});
			await repState.awaitInitialReplication();

			// Wait for connections
			repState = _db.callEvents.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true
				},
				query: callEventQuery
			});

			// Wait for transactions
			repState = _db.transactions.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true
				},
				query: transactionQuery
			});

			// Live sync this Talent's links
			_db.links.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: linkQuery
			});

			// Live sync this Talent's connections
			_db.callEvents.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: callEventQuery
			});

			// Live sync this Talent's transactions
			_db.transactions.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: transactionQuery
			});

			// Live sync this Talent
			_db.talents.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: talentQuery
			});
		}
	}
	_talentDB.set(key, _db);
	return _db;
};

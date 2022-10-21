import { PUBLIC_CREATORS_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import { connectionSchema, type ConnectionCollection } from '$lib/ORM/models/connection';
import { linkDocMethods, linkSchema, type LinkCollection } from '$lib/ORM/models/link';
import { talentDocMethods, talentSchema, type TalentCollection } from '$lib/ORM/models/talent';
import { transactionSchema, type TransactionCollection } from '$lib/ORM/models/transaction';
import type { StorageTypes } from '$lib/ORM/rxdb';
import { initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type CreatorsCollections = {
	talents: TalentCollection;
	links: LinkCollection;
	feedbacks: ConnectionCollection;
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
		feedbacks: {
			schema: connectionSchema
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

		let repState = _db.talents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: talentQuery
		});
		await repState.awaitInitialReplication();

		const _currentTalent = await talentQuery.exec();
		if (_currentTalent) {
			// Wait for links
			repState = _db.links.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true
				},
				query: _db.links.find().where('talent').eq(_currentTalent._id)
			});
			await repState.awaitInitialReplication();

			// Wait for feedbacks
			repState = _db.feedbacks.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true
				},
				query: _db.feedbacks.findOne().where('link').eq(_currentTalent.currentLink)
			});
			await repState.awaitInitialReplication();

			// Live sync this Talent's links
			_db.links.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: _db.links.find().where('talent').eq(_currentTalent._id)
			});

			// Live sync this Talent's feedbacks
			_db.feedbacks.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: _db.feedbacks.find().where('talent').eq(_currentTalent._id)
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

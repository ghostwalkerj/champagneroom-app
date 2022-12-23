import { PUBLIC_CREATORS_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import {
	agentDocMethods,
	agentSchema,
	agentStaticMethods,
	type AgentCollection
} from '$lib/ORM/models/agent';

import { linkDocMethods, linkSchema, type LinkCollection } from '$lib/ORM/models/link';
import { talentDocMethods, talentSchema, type TalentCollection } from '$lib/ORM/models/talent';
import { transactionSchema, type TransactionCollection } from '$lib/ORM/models/transaction';
import { StorageTypes, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;

type AllCollections = {
	agents: AgentCollection;
	talents: TalentCollection;
	links: LinkCollection;
	transactions: TransactionCollection;
};

export type AgentDBType = RxDatabase<AllCollections>;
const _agentDB = new Map<string, AgentDBType>();

export const agentDB = async (token: string, agentId: string, storage: StorageTypes) =>
	await create(token, agentId, storage);

const create = async (token: string, agentId: string, storage: StorageTypes) => {
	let _db = _agentDB.get(agentId);
	if (_db) return _db;

	initRXDB(storage);

	const wrappedStorage = wrappedKeyEncryptionStorage({
		storage: getRxStoragePouch(storage)
	});

	_db = await createRxDatabase({
		name: 'pouchdb/agent_db',
		storage: wrappedStorage,
		ignoreDuplicate: true,
		password: PUBLIC_RXDB_PASSWORD
	});

	await _db.addCollections({
		agents: {
			schema: agentSchema,
			methods: agentDocMethods,
			statics: agentStaticMethods
		},
		talents: {
			schema: talentSchema,
			methods: talentDocMethods
		},
		links: {
			schema: linkSchema,
			methods: linkDocMethods
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

		const agentQuery = _db.agents.findOne(agentId);
		const talentQuery = _db.talents.find().where('agent').eq(agentId);
		const talentIDs = await talentQuery.exec().then((talents) => talents.map((t) => t._id));
		const linkQuery = _db.links.find().where('talent').in(talentIDs);
		const transactionQuery = _db.transactions.find().where('talent').in(talentIDs);

		let repState = _db.agents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: agentQuery
		});
		await repState.awaitInitialReplication();

		repState = _db.talents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: talentQuery
		});
		await repState.awaitInitialReplication();

		repState = _db.links.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: linkQuery
		});
		await repState.awaitInitialReplication();

		repState = _db.transactions.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: transactionQuery
		});
		await repState.awaitInitialReplication();

		_db.agents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true,
				live: true
			},
			query: agentQuery
		});
		_db.talents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true,
				live: true
			},
			query: talentQuery
		});
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
	}

	_agentDB.set(agentId, _db);
	return _db;
};

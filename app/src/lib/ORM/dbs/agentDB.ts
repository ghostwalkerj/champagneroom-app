import {
	agentDocMethods,
	agentSchema,
	agentStaticMethods,
	type AgentCollection
} from '$lib/ORM/models/agent';
import { feedbackSchema, type FeedbackCollection } from '$lib/ORM/models/feedback';
import { linkSchema, type LinkCollection } from '$lib/ORM/models/link';
import { talentDocMethods, talentSchema, type TalentCollection } from '$lib/ORM/models/talent';
import { initRXDB, StorageTypes } from '$lib/ORM/rxdb';
import { CREATORS_ENDPOINT, RXDB_PASSWORD } from '$lib/util/constants';
import { EventEmitter } from 'events';
import { createRxDatabase, removeRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;

type AllCollections = {
	agents: AgentCollection;
	talents: TalentCollection;
	links: LinkCollection;
	feedbacks: FeedbackCollection;
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
		password: RXDB_PASSWORD
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
			schema: linkSchema
		},
		feedbacks: {
			schema: feedbackSchema
		}
	});

	if (CREATORS_ENDPOINT) {
		// Sync if there is a remote endpoint
		const remoteDB = new PouchDB(CREATORS_ENDPOINT, {
			fetch: function (
				url: string,
				opts: { headers: { set: (arg0: string, arg1: string) => void } }
			) {
				opts.headers.set('Authorization', 'Bearer ' + token);
				return PouchDB.fetch(url, opts);
			}
		});

		const agentQuery = _db.agents.findOne(agentId);

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
			query: _db.talents.find().where('agent').eq(agentId)
		});
		await repState.awaitInitialReplication();

		repState = _db.links.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: _db.links.find().where('agent').eq(agentId)
		});
		await repState.awaitInitialReplication();

		repState = _db.feedbacks.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: _db.feedbacks.find().where('agent').eq(agentId)
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
			query: _db.talents.find().where('agent').eq(agentId)
		});
		_db.links.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true,
				live: true
			},
			query: _db.links.find().where('agent').eq(agentId)
		});
		_db.feedbacks.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true,
				live: true
			},
			query: _db.feedbacks.find().where('agent').eq(agentId)
		});
	}

	_agentDB.set(agentId, _db);
	return _db;
};

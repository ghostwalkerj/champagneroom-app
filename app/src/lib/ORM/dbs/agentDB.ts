import { CREATORS_ENDPOINT, RXDB_PASSWORD } from '$lib/constants';
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
import { EventEmitter } from 'events';
import { createRxDatabase, removeRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 25;

type AllCollections = {
	agents: AgentCollection;
	talents: TalentCollection;
	links: LinkCollection;
	feedbacks: FeedbackCollection;
};

export type AgentDBType = RxDatabase<AllCollections>;
let _agentDB: AgentDBType;

export const agentDB = async (token: string, agentId: string, storage: StorageTypes) =>
	_agentDB ? _agentDB : await create(token, agentId, storage);

const create = async (token: string, agentId: string, storage: StorageTypes) => {
	initRXDB(storage);
	await removeRxDatabase('pouchdb/agent_db', getRxStoragePouch(storage));

	const _db: AgentDBType = await createRxDatabase({
		name: 'pouchdb/agent_db',
		storage: getRxStoragePouch(storage),
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
			waitForLeadership: true,
			options: {
				retry: true,
				live: true
			},
			query: agentQuery
		});
		_db.talents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: true,
			options: {
				retry: true,
				live: true
			},
			query: _db.talents.find().where('agent').eq(agentId)
		});
		_db.links.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: true,
			options: {
				retry: true,
				live: true
			},
			query: _db.links.find().where('agent').eq(agentId)
		});
		_db.feedbacks.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: true,
			options: {
				retry: true,
				live: true
			},
			query: _db.feedbacks.find().where('agent').eq(agentId)
		});
	}

	_agentDB = _db;
	return _agentDB;
};

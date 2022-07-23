import { CREATORS_ENDPOINT, RXDB_PASSWORD } from '$lib/constants';
import {
	agentSchema,
	agentStaticMethods,
	type AgentCollection,
	type AgentDocument
} from '$lib/db/models/agent';
import * as PouchHttpPlugin from 'pouchdb-adapter-http';
import * as idb from 'pouchdb-adapter-idb';
import { addRxPlugin, createRxDatabase, removeRxDatabase, type RxDatabase } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBEncryptionPlugin } from 'rxdb/plugins/encryption';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { addPouchPlugin, getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBReplicationCouchDBPlugin } from 'rxdb/plugins/replication-couchdb';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBValidatePlugin } from 'rxdb/plugins/validate';
import { writable } from 'svelte/store';
import { agentDocMethods } from '$lib/db/models/agent';
import { talentSchema, type TalentCollection } from '$lib/db/models/talent';

type CreatorsCollections = {
	agents: AgentCollection;
	talents: TalentCollection;
};

export type AgentDB = RxDatabase<CreatorsCollections>;
let _agentDB: AgentDB;

export const agentDB = async (token: string, agentId: string) =>
	_agentDB ? _agentDB : await _create(token, agentId);

const _create = async (token: string, agentId: string) => {
	addRxPlugin(RxDBLeaderElectionPlugin);
	addRxPlugin(RxDBReplicationCouchDBPlugin);
	addPouchPlugin(idb);
	addRxPlugin(RxDBQueryBuilderPlugin);
	addRxPlugin(RxDBValidatePlugin);
	addPouchPlugin(PouchHttpPlugin);
	addRxPlugin(RxDBUpdatePlugin);
	addRxPlugin(RxDBDevModePlugin);
	addRxPlugin(RxDBEncryptionPlugin);
	await removeRxDatabase('agentdb', getRxStoragePouch('idb'));

	const _db: AgentDB = await createRxDatabase({
		name: 'agentdb',
		storage: getRxStoragePouch('idb'),
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
			schema: talentSchema
		}
	});

	const remoteDB = new PouchDB(CREATORS_ENDPOINT, {
		skip_setup: true,
		fetch: function (
			url: string,
			opts: { headers: { set: (arg0: string, arg1: string) => void } }
		) {
			//opts.headers.set('x-auth-token', 'Bearer ' + token);
			return PouchDB.fetch(url, opts);
		}
	});
	const query = _db.agents.findOne(agentId);

	let repState = _db.agents.syncCouchDB({
		remote: remoteDB,
		waitForLeadership: false,
		options: {
			retry: true
		},
		query
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

	_db.agents.syncCouchDB({
		remote: remoteDB,
		waitForLeadership: true,
		options: {
			retry: true,
			live: true
		},
		query
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
	_agentDB = _db;
	return _agentDB;
};

export const currentAgent = writable<AgentDocument>();
export const currentAgentDB = writable<RxDatabase<CreatorsCollections>>();

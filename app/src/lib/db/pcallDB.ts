import { agentSchema, type AgentCollection, type AgentDocument } from '$lib/db/models/agent';
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
import {
	COUCHDB_PASSWORD,
	COUCHDB_USER,
	RXDB_PASSWORD,
	COUCH_ENDPOINT,
	COUCHDB_AUTH
} from '../constants';

type MyDatabaseCollections = {
	agent: AgentCollection;
};

export type pcallDB = RxDatabase<MyDatabaseCollections>;
let dbPromise: Promise<pcallDB> | null;

export const agentDB = (token: string, address: string) =>
	dbPromise ? dbPromise : _create(token, address);

const _create = async (token: string, address: string) => {
	addRxPlugin(RxDBLeaderElectionPlugin);
	addRxPlugin(RxDBReplicationCouchDBPlugin);
	addPouchPlugin(idb);
	addRxPlugin(RxDBQueryBuilderPlugin);
	addRxPlugin(RxDBValidatePlugin);
	addPouchPlugin(PouchHttpPlugin);
	addRxPlugin(RxDBUpdatePlugin);
	addRxPlugin(RxDBDevModePlugin);
	addRxPlugin(RxDBEncryptionPlugin);

	await removeRxDatabase('pcall', getRxStoragePouch('idb'));

	const _db: pcallDB = await createRxDatabase({
		name: 'pcall',
		storage: getRxStoragePouch('idb'),
		ignoreDuplicate: true,
		password: RXDB_PASSWORD
	});

	await _db.addCollections({
		agent: {
			schema: agentSchema
		}
	});

	const remoteDB = new PouchDB(COUCH_ENDPOINT, {
		skip_setup: true,
		fetch: function (url, opts) {
			opts.headers.set('x-auth-token', 'Bearer ' + token);
			return PouchDB.fetch(url, opts);
		}
	});

	const repState = _db.agent.syncCouchDB({
		remote: remoteDB,
		waitForLeadership: false,
		options: {
			retry: true
		},
		query: _db.agent
			.findOne()
			.where('_id')
			.eq('agent:' + address)
	});

	await repState.awaitInitialReplication();

	_db.agent.syncCouchDB({
		remote: remoteDB,
		waitForLeadership: false,
		options: {
			retry: true,
			live: true
		},
		query: _db.agent
			.findOne()
			.where('_id')
			.eq('agent:' + address)
	});

	return _db;
};

export const currentAgent = writable<AgentDocument>();

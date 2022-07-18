import * as idb from 'pouchdb-adapter-idb';
import { removeRxDatabase, type RxDatabase } from 'rxdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/dist/lib/plugins/query-builder/index.js';
import { RxDBReplicationCouchDBPlugin } from 'rxdb/dist/lib/plugins/replication-couchdb.js';
import { RxDBValidatePlugin } from 'rxdb/dist/lib/plugins/validate.js';
import { writable } from 'svelte/store';
import { agentSchema, type AgentCollection, type AgentDocument } from '$lib/db/models/agent';
import * as PouchHttpPlugin from 'pouchdb-adapter-http';
import { addRxPlugin, createRxDatabase } from 'rxdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/dist/lib/plugins/leader-election.js';
import { addPouchPlugin, getRxStoragePouch } from 'rxdb/dist/lib/plugins/pouchdb/index.js';
import { RxDBUpdatePlugin } from 'rxdb/dist/lib/plugins/update.js';
import { RxDBDevModePlugin } from 'rxdb/dist/lib/plugins/dev-mode/index.js';
import { RXDB_PASSWORD } from '../constants';
import { RxDBEncryptionPlugin } from 'rxdb/dist/lib/plugins/encryption.js';

const SYNCCOUCHDB_URL = import.meta.env.VITE_SYNCCOUCHDB_URL;

type MyDatabaseCollections = {
	agent: AgentCollection;
};

export type pcallDB = RxDatabase<MyDatabaseCollections>;
let dbPromise: Promise<pcallDB> | null;

export const agentDB = (address: string) => (dbPromise ? dbPromise : _create(address));

const _create = async (address: string) => {
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

	const repState = _db.agent.syncCouchDB({
		remote: SYNCCOUCHDB_URL,
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
		remote: SYNCCOUCHDB_URL,
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

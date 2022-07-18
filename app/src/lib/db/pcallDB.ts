import * as idb from 'pouchdb-adapter-idb';
import type { RxDatabase } from 'rxdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBReplicationCouchDBPlugin } from 'rxdb/plugins/replication-couchdb';
import { RxDBValidatePlugin } from 'rxdb/plugins/validate';
import { writable } from 'svelte/store';

import { agentSchema, type AgentCollection, type AgentDocument } from '$lib/db/models/agent';
import * as PouchHttpPlugin from 'pouchdb-adapter-http';
import { addRxPlugin, createRxDatabase } from 'rxdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { addPouchPlugin, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';

const SYNCCOUCHDB_URL = import.meta.env.VITE_SYNCCOUCHDB_URL as string;

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
	//addRxPlugin(RxDBMigrationPlugin);

	const _db: pcallDB = await createRxDatabase({
		name: 'pcall',
		storage: getRxStoragePouch('idb'),
		ignoreDuplicate: true
	});
	await _db.addCollections({
		agent: {
			schema: agentSchema
		}
	});

	_db.agent.syncCouchDB({
		remote: SYNCCOUCHDB_URL,
		waitForLeadership: false,
		options: {
			retry: true,
			live: true
		}
		// query: _db.agent.find().where('address').eq(address).where('entityType').eq('agent')
	});
	return _db;
};

export const currentAgent = writable<AgentDocument>();

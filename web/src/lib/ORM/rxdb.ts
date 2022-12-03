import * as PouchHttpPlugin from 'pouchdb-adapter-http';
import * as idb from 'pouchdb-adapter-idb';
import nodewebsql from 'pouchdb-adapter-node-websql';
import { addRxPlugin } from 'rxdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { addPouchPlugin } from 'rxdb/plugins/pouchdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBReplicationCouchDBPlugin } from 'rxdb/plugins/replication-couchdb';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

const initialized = {
	init: false,
	idb: false,
	websql: false
};

export enum StorageTypes {
	IDB = 'idb',
	NODE_WEBSQL = 'websql'
}

export const initRXDB = (storage: StorageTypes) => {
	if (initialized[storage]) return;
	if (storage === StorageTypes.IDB) addPouchPlugin(idb);
	else addPouchPlugin(nodewebsql);
	initialized[storage] = true;

	if (!initialized.init) {
		addPouchPlugin(PouchHttpPlugin);
		addRxPlugin(RxDBLeaderElectionPlugin);
		addRxPlugin(RxDBReplicationCouchDBPlugin);
		addRxPlugin(RxDBQueryBuilderPlugin);
		addRxPlugin(RxDBUpdatePlugin);
		initialized.init = true;
	}
};
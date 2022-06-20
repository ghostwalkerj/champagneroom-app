import find from 'pouchdb-find';
import PouchDB from 'pouchdb-node';

const REMOTE_DB_URL = import.meta.env.VITE_REMOTE_COUCHDB_URL;
const LOCAL_DB_URL = import.meta.env.VITE_LOCAL_COUCHDB_URL;

let db: PouchDB.Database = undefined;

export const getDb = (): PouchDB.Database => {
	if (db === undefined) {
		try {
			PouchDB.plugin(find);

			const localDB = new PouchDB(LOCAL_DB_URL);
			const remoteDB = new PouchDB(REMOTE_DB_URL);
			db = localDB;
			localDB.sync(remoteDB, {
				live: true,
				retry: true
			});
		} catch (err) {
			console.log(err);
		}
	}

	return db;
};

export type PCallDocument = {
	_id: string;
	name: string;
	amount: string;
	expired: boolean;
	address: string;
	created_at: string;
};

import { CREATORS_ENDPOINT, RXDB_PASSWORD } from '$lib/constants';
import {
	talentDocMethods,
	TalentDocument,
	talentSchema,
	type TalentCollection
} from '$lib/db/models/talent';
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
import { LinkCollection, linkDocMethods, linkSchema } from '$lib/db/models/link';

type CreatorsCollections = {
	talents: TalentCollection;
	links: LinkCollection;
};

export type TalentDB = RxDatabase<CreatorsCollections>;
let _talentDB: TalentDB;

export const talentDB = async (token: string, key: string) =>
	_talentDB ? _talentDB : await _create(token, key);

let _currentTalent: TalentDocument | null;

const _create = async (token: string, key: string) => {
	addRxPlugin(RxDBLeaderElectionPlugin);
	addRxPlugin(RxDBReplicationCouchDBPlugin);
	addPouchPlugin(idb);
	addRxPlugin(RxDBQueryBuilderPlugin);
	addRxPlugin(RxDBValidatePlugin);
	addPouchPlugin(PouchHttpPlugin);
	addRxPlugin(RxDBUpdatePlugin);
	addRxPlugin(RxDBDevModePlugin);
	addRxPlugin(RxDBEncryptionPlugin);
	await removeRxDatabase('talentdb', getRxStoragePouch('idb'));

	const _db: TalentDB = await createRxDatabase({
		name: 'talentdb',
		storage: getRxStoragePouch('idb'),
		ignoreDuplicate: true,
		password: RXDB_PASSWORD
	});

	await _db.addCollections({
		talents: {
			schema: talentSchema,
			methods: talentDocMethods
		},
		links: {
			schema: linkSchema,
			methods: linkDocMethods
		}
	});

	const remoteDB = new PouchDB(CREATORS_ENDPOINT, {
		fetch: function (
			url: string,
			opts: { headers: { set: (arg0: string, arg1: string) => void } }
		) {
			opts.headers.set('Authorization', 'Bearer ' + token);
			return PouchDB.fetch(url, opts);
		}
	});
	const query = _db.talents.findOne().where('key').eq(key);
	_currentTalent = await query.exec();

	if (_currentTalent) {
		currentTalent.set(_currentTalent);

		let repState = _db.talents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query
		});
		await repState.awaitInitialReplication();

		repState = _db.links.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: _db.links.find().where('talent').eq(_currentTalent._id)
		});

		await repState.awaitInitialReplication();

		_db.talents.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: true,
			options: {
				retry: true,
				live: true
			},
			query
		});
		_db.links.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: true,
			options: {
				retry: true,
				live: true
			},
			query: _db.talents.find().where('talent').eq(_currentTalent._id)
		});
	}
	_talentDB = _db;
	currentTalentDB.set(_db);
	return _talentDB;
};

export const currentTalent = writable<TalentDocument>();
export const currentTalentDB = writable<RxDatabase<CreatorsCollections>>();

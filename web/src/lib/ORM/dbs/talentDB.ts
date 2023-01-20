import {
  PUBLIC_RXDB_PASSWORD,
  PUBLIC_TALENT_DB_ENDPOINT,
} from '$env/static/public';
import {
  showDocMethods,
  showSchema,
  type ShowCollection,
} from '$lib/ORM/models/show';
import {
  talentDocMethods,
  talentSchema,
  type TalentCollection,
} from '$lib/ORM/models/talent';
import { StorageTypes, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;

type CreatorsCollections = {
  talents: TalentCollection;
  shows: ShowCollection;
};

export type TalentDBType = RxDatabase<CreatorsCollections>;
const _talentDB = new Map<string, TalentDBType>();

export const talentDB = async (token: string, key: string) =>
  await create(token, key);

const create = async (token: string, key: string) => {
  let _db = _talentDB.get(key);
  if (_db) return _db;
  initRXDB(StorageTypes.IDB);

  const wrappedStorage = wrappedKeyEncryptionStorage({
    storage: getRxStoragePouch(StorageTypes.IDB),
  });

  _db = await createRxDatabase({
    name: 'pouchdb/pcall_db',
    storage: wrappedStorage,
    ignoreDuplicate: true,
    password: PUBLIC_RXDB_PASSWORD,
  });

  await _db.addCollections({
    talents: {
      schema: talentSchema,
      methods: talentDocMethods,
    },
    shows: {
      schema: showSchema,
      methods: showDocMethods,
    },
  });

  if (PUBLIC_TALENT_DB_ENDPOINT) {
    // Sync if there is a remote endpoint
    const remoteDB = new PouchDB(PUBLIC_TALENT_DB_ENDPOINT, {
      fetch: function (
        url: string,
        opts: { headers: { set: (arg0: string, arg1: string) => void } }
      ) {
        opts.headers.set('Authorization', 'Bearer ' + token);
        return PouchDB.fetch(url, opts);
      },
    });
    const talentQuery = _db.talents.findOne().where('key').eq(key);

    let repState = _db.talents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
      query: talentQuery,
    });
    await repState.awaitInitialReplication();

    const _currentTalent = await talentQuery.exec();

    if (_currentTalent) {
      const showQuery = _db.shows
        .find()
        .where('talent')
        .eq(_currentTalent?._id);

      // Wait for shows
      repState = _db.shows.syncCouchDB({
        remote: remoteDB,
        waitForLeadership: false,
        options: {
          retry: true,
        },
        query: showQuery,
      });
      await repState.awaitInitialReplication();

      // Live sync this Talent's shows
      _db.shows.syncCouchDB({
        remote: remoteDB,
        waitForLeadership: false,
        options: {
          retry: true,
          live: true,
        },
        query: showQuery,
      });

      // Live sync this Talent
      _db.talents.syncCouchDB({
        remote: remoteDB,
        waitForLeadership: false,
        options: {
          retry: true,
          live: true,
        },
        query: talentQuery,
      });
    }
  }
  _talentDB.set(key, _db);
  return _db;
};

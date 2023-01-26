import {
  PUBLIC_RXDB_PASSWORD,
  PUBLIC_SHOW_DB_ENDPOINT,
} from '$env/static/public';
import { StorageType, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';

import {
  showSchema,
  type ShowCollection,
  type ShowDocument,
} from '$lib/ORM/models/show';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type PublicCollections = {
  shows: ShowCollection;
};

export type ShowDBType = RxDatabase<PublicCollections>;
const _showDB = new Map<string, ShowDBType>();
export const showDB = async (
  token: string,
  showId: string
): Promise<ShowDBType> => await create(token, showId);

let _thisShow: ShowDocument;

const create = async (token: string, showId: string) => {
  let _db = _showDB.get(showId);
  if (_db) return _db;

  initRXDB(StorageType.IDB);

  const wrappedStorage = wrappedKeyEncryptionStorage({
    storage: getRxStoragePouch(StorageType.IDB),
  });

  _db = await createRxDatabase({
    name: 'pouchdb/pcall_db',
    storage: wrappedStorage,
    ignoreDuplicate: true,
    password: PUBLIC_RXDB_PASSWORD,
  });

  await _db.addCollections({
    shows: {
      schema: showSchema,
    },
  });

  if (PUBLIC_SHOW_DB_ENDPOINT) {
    // Sync if there is a remote endpoint
    const remoteDB = new PouchDB(PUBLIC_SHOW_DB_ENDPOINT, {
      fetch: function (
        url: string,
        opts: { headers: { set: (arg0: string, arg1: string) => void } }
      ) {
        opts.headers.set('Authorization', 'Bearer ' + token);
        return PouchDB.fetch(url, opts);
      },
    });
    const showQuery = _db.shows.findOne(showId);

    const repState = _db.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
      query: showQuery,
    });
    await repState.awaitInitialReplication();

    _thisShow = (await showQuery.exec()) as ShowDocument;
    if (_thisShow) {
      _db.shows.syncCouchDB({
        remote: remoteDB,
        waitForLeadership: false,
        options: {
          retry: true,
          live: true,
        },
        query: showQuery,
      });
    }
  }
  _showDB.set(showId, _db);
  return _db;
};

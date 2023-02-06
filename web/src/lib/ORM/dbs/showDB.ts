import {
  PUBLIC_RXDB_PASSWORD,
  PUBLIC_SHOW_DB_ENDPOINT,
} from '$env/static/public';
import type { DatabaseOptions } from '$lib/ORM/rxdb';
import { StorageType, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';

import {
  showDocMethods,
  showSchema,
  type ShowCollection,
  type ShowDocument,
} from '$lib/ORM/models/show';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import { ticketSchema, type TicketCollection } from '../models/ticket';
import type { ShowEventCollection } from '../models/showEvent';
import { showEventSchema } from '../models/showEvent';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type ShowCollections = {
  shows: ShowCollection;
  tickets: TicketCollection;
  showEvents: ShowEventCollection;
};

export type ShowDBType = RxDatabase<ShowCollections>;
const _showDB = new Map<string, ShowDBType>();
export const showDB = async (
  showId: string,
  token: string,
  databaseOptions?: DatabaseOptions
): Promise<ShowDBType> => await create(showId, token, databaseOptions);

let _thisShow: ShowDocument;

const create = async (
  showId: string,
  token: string,
  databaseOptions?: DatabaseOptions
) => {
  let _db = _showDB.get(showId);
  if (_db) return _db;

  const storageType = databaseOptions
    ? databaseOptions.storageType
    : StorageType.IDB;
  const endPoint = databaseOptions
    ? databaseOptions.endPoint
    : PUBLIC_SHOW_DB_ENDPOINT;

  initRXDB(storageType);

  const wrappedStorage = wrappedKeyEncryptionStorage({
    storage: getRxStoragePouch(storageType),
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
      methods: showDocMethods,
    },
    showEvents: {
      schema: showEventSchema,
    },
    tickets: {
      schema: ticketSchema,
    },
  });

  // Sync if there is a remote endpoint
  const remoteDB = new PouchDB(endPoint, {
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
  _showDB.set(showId, _db);
  return _db;
};

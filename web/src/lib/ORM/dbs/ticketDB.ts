import {
  PUBLIC_RXDB_PASSWORD,
  PUBLIC_SHOW_DB_ENDPOINT,
  PUBLIC_TALENT_DB_ENDPOINT,
  PUBLIC_TICKET_DB_ENDPOINT,
} from '$env/static/public';
import type { DatabaseOptions } from '$lib/ORM/rxdb';
import { StorageType, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';

import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

import {
  showSchema,
  type ShowCollection,
  showDocMethods,
} from '$lib/ORM/models/show';
import {
  ticketSchema,
  type TicketCollection,
  type TicketDocument,
  ticketDocMethods,
} from '$lib/ORM/models/ticket';
import { transactionSchema } from '../models/transaction';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type PublicCollections = {
  tickets: TicketCollection;
  shows: ShowCollection;
};

export type TicketDBType = RxDatabase<PublicCollections>;
const _ticketDB = new Map<string, TicketDBType>();
export const ticketDB = async (
  ticketId: string,
  token: string,
  databaseOptions?: DatabaseOptions
): Promise<TicketDBType> => await create(ticketId, token, databaseOptions);

const create = async (
  ticketId: string,
  token: string,
  databaseOptions?: DatabaseOptions
) => {
  let _db = _ticketDB.get(ticketId);
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
    tickets: {
      schema: ticketSchema,
      methods: ticketDocMethods,
    },
    shows: {
      schema: showSchema,
      methods: showDocMethods,
    },
    transactions: {
      schema: transactionSchema,
    },
  });

  const remoteDB = new PouchDB(endPoint, {
    fetch: function (
      url: string,
      opts: { headers: { set: (arg0: string, arg1: string) => void } }
    ) {
      opts.headers.set('Authorization', 'Bearer ' + token);
      return PouchDB.fetch(url, opts);
    },
  });
  const ticketQuery = _db.tickets.findOne(ticketId);

  let repState = _db.tickets.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: ticketQuery,
  });
  await repState.awaitInitialReplication();

  const _thisTicket = (await ticketQuery.exec()) as TicketDocument;
  if (_thisTicket) {
    const showQuery = _db.shows.findOne(_thisTicket.show);

    repState = _db.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
      query: showQuery,
    });
    await repState.awaitInitialReplication();

    _db.tickets.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: ticketQuery,
    });

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
  _ticketDB.set(ticketId, _db);
  return _db;
};

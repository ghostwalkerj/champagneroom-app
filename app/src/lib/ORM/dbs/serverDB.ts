import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import type { DatabaseOptions } from '../rxdb';
import { initRXDB } from '../rxdb';

import { getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';
import {
  showDocMethods,
  showSchema,
  ShowString,
  type ShowCollection,
} from '../models/show';
import type { ShowEventCollection } from '../models/showEvent';
import { showeventSchema, ShowEventString } from '../models/showEvent';
import {
  ticketSchema,
  TicketString,
  type TicketCollection,
} from '../models/ticket';
import {
  transactionSchema,
  TransactionString,
  type TransactionCollection,
} from '../models/transaction';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 0;

type ServerCollections = {
  shows: ShowCollection;
  tickets: TicketCollection;
  showevents: ShowEventCollection;
  transactions: TransactionCollection;
};

export type ServerDBType = RxDatabase<ServerCollections>;

export const serverDB = async (
  token: string,
  databaseOptions: DatabaseOptions
): Promise<ServerDBType> => {
  initRXDB(databaseOptions.storageType);

  const wrappedStorage = wrappedKeyEncryptionStorage({
    storage: getRxStoragePouch(databaseOptions.storageType),
  });

  const _db = (await createRxDatabase({
    name: 'pouchdb/pcall_db',
    storage: wrappedStorage,
    ignoreDuplicate: true,
    password: databaseOptions.rxdbPassword,
  })) as ServerDBType;

  await _db.addCollections({
    shows: {
      schema: showSchema,
      methods: showDocMethods,
    },
    showevents: {
      schema: showeventSchema,
    },
    tickets: {
      schema: ticketSchema,
    },
    transactions: {
      schema: transactionSchema,
    },
  });

  // Sync if there is a remote endpoint
  const remoteDB = new PouchDB(databaseOptions.endPoint, {
    fetch: function (
      url: string,
      opts: { headers: { set: (arg0: string, arg1: string) => void } }
    ) {
      opts.headers.set('Authorization', 'Bearer ' + token);
      return PouchDB.fetch(url, opts);
    },
  });

  const activeShowQuery = _db.shows
    .find()
    .where('entityType')
    .eq(ShowString)
    .where('showState.active')
    .eq(true);

  const activeTicketQuery = _db.tickets
    .find()
    .where('entityType')
    .eq(TicketString)
    .where('ticketState.active')
    .eq(true);

  const showeventQuery = _db.showevents
    .find()
    .where('entityType')
    .eq(ShowEventString);

  const transactionQuery = _db.transactions
    .find()
    .where('entityType')
    .eq(TransactionString);

  let repState = _db.shows.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: activeShowQuery,
  });
  await repState.awaitInitialReplication();

  repState = _db.tickets.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: activeTicketQuery,
  });
  await repState.awaitInitialReplication();

  _db.shows.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: activeShowQuery,
  });

  // Live sync showevents
  _db.showevents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: showeventQuery,
  });

  // Live sync tickets
  _db.tickets.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: activeTicketQuery,
  });

  // Live sync transactions
  _db.transactions.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: transactionQuery,
  });

  return _db;
};

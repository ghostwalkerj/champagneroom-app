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
import {
  showeventSchema,
  ShowEventString,
  type ShowEventCollection,
} from '../models/showEvent';
import {
  ticketDocMethods,
  ticketSchema,
  TicketString,
  type TicketCollection,
  type TicketDocument,
} from '../models/ticket';
import {
  transactionSchema,
  TransactionString,
  type TransactionCollection,
} from '../models/transaction';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 0;
type PublicCollections = {
  tickets: TicketCollection;
  shows: ShowCollection;
  showevents: ShowEventCollection;
  transactions: TransactionCollection;
};

export type TicketDBType = RxDatabase<PublicCollections>;
const _ticketDB = new Map<string, TicketDBType>();
export const ticketDB = async (
  ticketId: string,
  token: string,
  databaseOptions: DatabaseOptions
): Promise<TicketDBType> => await create(ticketId, token, databaseOptions);

const create = async (
  ticketId: string,
  token: string,
  databaseOptions: DatabaseOptions
) => {
  let _db = _ticketDB.get(ticketId);
  if (_db) return _db;

  const storageType = databaseOptions.storageType;
  const endPoint = databaseOptions.endPoint;

  initRXDB(storageType);

  const wrappedStorage = wrappedKeyEncryptionStorage({
    storage: getRxStoragePouch(storageType),
  });

  _db = await createRxDatabase({
    name: 'pouchdb/pcall_db',
    storage: wrappedStorage,
    ignoreDuplicate: true,
    password: databaseOptions.rxdbPassword,
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
    showevents: {
      schema: showeventSchema,
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
  const ticketQuery = _db.tickets
    .findOne(ticketId)
    .where('entityType')
    .eq(TicketString);

  let repState = _db.tickets.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: ticketQuery,
  });
  await repState.awaitInitialReplication();

  const ticket = (await ticketQuery.exec()) as TicketDocument;
  if (ticket?.ticketState.active) {
    const showQuery = _db.shows
      .findOne(ticket.show)
      .where('entityType')
      .eq(ShowString);

    const showeventQuery = _db.showevents
      .find()
      .where('ticket')
      .eq(ticket._id)
      .where('entityType')
      .eq(ShowEventString);

    const transactionQuery = _db.transactions
      .find()
      .where('ticket')
      .eq(ticketId)
      .where('entityType')
      .eq(TransactionString);

    repState = _db.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
      query: showQuery,
    });
    await repState.awaitInitialReplication();

    _db.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: showQuery,
    });

    repState = _db.tickets.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: ticketQuery,
    });

    _db.showevents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: showeventQuery,
    });

    _db.transactions.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: transactionQuery,
    });
  }
  _ticketDB.set(ticketId, _db);
  return _db;
};

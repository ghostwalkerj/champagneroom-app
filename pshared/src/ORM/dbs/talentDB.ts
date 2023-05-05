import {
  ShowString,
  showDocMethods,
  showSchema,
  type ShowCollection,
} from '../models/show';
import {
  TalentString,
  talentDocMethods,
  talentSchema,
  type TalentCollection,
} from '../models/talent';
import type { DatabaseOptions } from '../rxdb';
import { initRXDB } from '../rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import {
  ShowEventString,
  showeventSchema,
  type ShowEventCollection,
} from '../models/showEvent';
import type { TicketCollection } from '../models/ticket';
import { TicketString, ticketDocMethods, ticketSchema } from '../models/ticket';
import {
  TransactionString,
  transactionSchema,
  type TransactionCollection,
} from '../models/transaction';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 0;

type TalentCollections = {
  talents: TalentCollection;
  shows: ShowCollection;
  showevents: ShowEventCollection;
  tickets: TicketCollection;
  transactions: TransactionCollection;
};

export type TalentDBType = RxDatabase<TalentCollections>;
const _talentDB = new Map<string, TalentDBType>();

export const talentDB = async (
  key: string,
  token: string,
  databaseOptions: DatabaseOptions
) => await create(key, token, databaseOptions);

const create = async (
  key: string,
  token: string,
  databaseOptions: DatabaseOptions
) => {
  let _db = _talentDB.get(key);
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
    talents: {
      schema: talentSchema,
      methods: talentDocMethods,
    },
    shows: {
      schema: showSchema,
      methods: showDocMethods,
    },
    showevents: {
      schema: showeventSchema,
    },
    tickets: {
      schema: ticketSchema,
      methods: ticketDocMethods,
    },
    transactions: {
      schema: transactionSchema,
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

  const talentQuery = _db.talents
    .findOne()
    .where('key')
    .eq(key)
    .where('entityType')
    .eq(TalentString);

  let repState = _db.talents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: talentQuery,
  });
  await repState.awaitInitialReplication();
  _db.talents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: talentQuery,
  });

  const currentTalent = await talentQuery.exec();

  const addCurrentShowDB = async (
    showId: string,
    db: TalentDBType | undefined
  ) => {
    if (!db) return;
    const showQuery = db.shows
      .findOne(showId)
      .where('entityType')
      .eq(ShowString);

    // Wait for currentShow
    repState = db.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
      query: showQuery,
    });
    await repState.awaitInitialReplication();

    db.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: showQuery,
    });

    const ticketQuery = db.tickets
      .find()
      .where('show')
      .eq(showId)
      .where('entityType')
      .eq(TicketString);

    // // Wait for tickets
    // repState = db.tickets.syncCouchDB({
    //   remote: remoteDB,
    //   waitForLeadership: false,
    //   options: {
    //     retry: true,
    //   },
    //   query: ticketQuery,
    // });
    // await repState.awaitInitialReplication();

    db.tickets.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: ticketQuery,
    });

    const showeventQuery = db.showevents
      .find()
      .where('show')
      .eq(showId)
      .where('entityType')
      .eq(ShowEventString);

    const transactionQuery = db.transactions
      .find()
      .where('show')
      .eq(showId)
      .where('entityType')
      .eq(TransactionString);

    // Live sync this Talent's showevents
    db.showevents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: showeventQuery,
    });

    // Live sync this Talent's transaction
    db.transactions.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: transactionQuery,
    });
  };

  if (currentTalent) {
    currentTalent.get$('currentShow').subscribe(async currentShow => {
      if (!currentShow) return;
      await addCurrentShowDB(currentShow, _db);
    });
  }

  _talentDB.set(key, _db);

  return _db;
};
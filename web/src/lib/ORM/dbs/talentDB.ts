import {
  PUBLIC_RXDB_PASSWORD,
  PUBLIC_TALENT_DB_ENDPOINT,
} from '$env/static/public';
import type { ShowDocument } from '$lib/ORM/models/show';
import {
  ShowString,
  showDocMethods,
  showSchema,
  type ShowCollection,
} from '$lib/ORM/models/show';
import {
  talentDocMethods,
  talentSchema,
  type TalentCollection,
  TalentString,
} from '$lib/ORM/models/talent';
import type { DatabaseOptions } from '$lib/ORM/rxdb';
import { StorageType, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import {
  type ShowEventCollection,
  ShowEventString,
  showeventSchema,
} from '../models/showevent';
import type { TicketCollection } from '../models/ticket';
import { TicketString, ticketSchema } from '../models/ticket';
import {
  type TransactionCollection,
  TransactionString,
  transactionSchema,
} from '../models/transaction';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;

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
  databaseOptions?: DatabaseOptions
) => await create(key, token, databaseOptions);

const create = async (
  key: string,
  token: string,
  databaseOptions?: DatabaseOptions
) => {
  let _db = _talentDB.get(key);
  if (_db) return _db;

  const storageType = databaseOptions
    ? databaseOptions.storageType
    : StorageType.IDB;
  const endPoint = databaseOptions
    ? databaseOptions.endPoint
    : PUBLIC_TALENT_DB_ENDPOINT;

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

  const _currentTalent = await talentQuery.exec();

  if (_currentTalent) {
    const showQuery = _db.shows
      .find()
      .where('talent')
      .eq(_currentTalent._id)
      .where('entityType')
      .eq(ShowString)
      .where('showState.active')
      .eq(true);

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

    const ticketQuery = _db.tickets
      .find()
      .where('talent')
      .eq(_currentTalent._id)
      .where('entityType')
      .eq(TicketString)
      .where('ticketState.active')
      .eq(true);

    // Wait for any tickets
    repState = _db.tickets.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
      query: ticketQuery,
    });
    await repState.awaitInitialReplication();

    let maxDate = new Date().getTime();

    if (_currentTalent.currentShow) {
      const _currentShow = (await _db.shows
        .findOne(_currentTalent.currentShow)
        .exec()) as ShowDocument;

      maxDate = _currentShow?.createdAt || maxDate;
    }

    const showeventQuery = _db.showevents
      .find()
      .where('talent')
      .eq(_currentTalent._id)
      .where('entityType')
      .eq(ShowEventString)
      .where('createdAt')
      .gte(maxDate);

    const transactionQuery = _db.transactions
      .find()
      .where('talent')
      .eq(_currentTalent._id)
      .where('entityType')
      .eq(TransactionString)
      .where('createdAt')
      .gte(maxDate);

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

    // Live sync this Talent's showevents
    _db.showevents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: showeventQuery,
    });

    // Live sync this Talent's tickets
    _db.tickets.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: ticketQuery,
    });

    // Live sync this Talent's transaction
    _db.transactions.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: transactionQuery,
    });

    _talentDB.set(key, _db);
    return _db;
  }
};

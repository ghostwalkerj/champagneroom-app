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
import type { DatabaseOptions } from '$lib/ORM/rxdb';
import { StorageType, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import type { ShowEventCollection } from '../models/showEvent';
import { showEventSchema } from '../models/showEvent';
import type { TicketCollection } from '../models/ticket';
import { ticketSchema } from '../models/ticket';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;

type TalentCollections = {
  talents: TalentCollection;
  shows: ShowCollection;
  showEvents: ShowEventCollection;
  tickets: TicketCollection;
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
    const currentShowQuery = _db.shows.findOne(_currentTalent.currentShow);
    const ticketQuery = _db.tickets
      .find()
      .where('show')
      .eq(_currentTalent?.currentShow);
    const showQuery = _db.shows.find().where('talent').eq(_currentTalent._id);
    const showEventQuery = _db.showEvents
      .find()
      .where('talent')
      .eq(_currentTalent._id);
    // Wait for shows
    repState = _db.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
      query: currentShowQuery,
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

    // Live sync this Talent's showEvents
    _db.showEvents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
      query: showEventQuery,
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

    _talentDB.set(key, _db);
    return _db;
  }
};

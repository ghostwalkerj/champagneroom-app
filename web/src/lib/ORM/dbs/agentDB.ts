import {
  PUBLIC_AGENT_DB_ENDPOINT,
  PUBLIC_RXDB_PASSWORD,
} from '$env/static/public';
import {
  AgentString,
  agentDocMethods,
  agentSchema,
  agentStaticMethods,
  type AgentCollection,
} from '$lib/ORM/models/agent';

import {
  ShowString,
  showDocMethods,
  showSchema,
  type ShowCollection,
} from '$lib/ORM/models/show';
import {
  ShowEventString,
  showEventSchema,
  type ShowEventCollection,
} from '$lib/ORM/models/showEvent';
import {
  talentDocMethods,
  talentSchema,
  type TalentCollection,
} from '$lib/ORM/models/talent';
import {
  TicketString,
  ticketDocMethods,
  ticketSchema,
  type TicketCollection,
} from '$lib/ORM/models/ticket';

import {
  TransactionString,
  transactionSchema,
  type TransactionCollection,
} from '$lib/ORM/models/transaction';
import type { DatabaseOptions } from '$lib/ORM/rxdb';
import { StorageType, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;

type AgentCollections = {
  agents: AgentCollection;
  talents: TalentCollection;
  tickets: TicketCollection;
  shows: ShowCollection;
  transactions: TransactionCollection;
  showEvents: ShowEventCollection;
};

export type AgentDBType = RxDatabase<AgentCollections>;
const _agentDB = new Map<string, AgentDBType>();

export const agentDB = async (
  agentId: string,
  token: string,
  databaseOptions?: DatabaseOptions
) => await create(agentId, token, databaseOptions);

const create = async (
  agentId: string,
  token: string,
  databaseOptions?: DatabaseOptions
) => {
  let _db = _agentDB.get(agentId);
  if (_db) return _db;

  const storageType = databaseOptions
    ? databaseOptions.storageType
    : StorageType.IDB;
  const endPoint = databaseOptions
    ? databaseOptions.endPoint
    : PUBLIC_AGENT_DB_ENDPOINT;

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
    agents: {
      schema: agentSchema,
      methods: agentDocMethods,
      statics: agentStaticMethods,
    },
    talents: {
      schema: talentSchema,
      methods: talentDocMethods,
    },
    shows: {
      schema: showSchema,
      methods: showDocMethods,
    },
    tickets: {
      schema: ticketSchema,
      methods: ticketDocMethods,
    },
    transactions: {
      schema: transactionSchema,
    },
    showEvents: {
      schema: showEventSchema,
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

  const agentQuery = _db.agents.findOne(agentId);
  const talentQuery = _db.talents
    .find()
    .where('agent')
    .eq(agentId)
    .where('entityType')
    .eq(AgentString);
  const showQuery = _db.shows
    .find()
    .where('agent')
    .eq(agentId)
    .where('entityType')
    .eq(ShowString);
  const ticketQuery = _db.tickets
    .find()
    .where('agent')
    .eq(agentId)
    .where('entityType')
    .eq(TicketString);
  const showEventQuery = _db.showEvents
    .find()
    .where('agent')
    .eq(agentId)
    .where('entityType')
    .eq(ShowEventString);
  const transactionQuery = _db.transactions
    .find()
    .where('agent')
    .eq(agentId)
    .where('entityType')
    .eq(TransactionString);

  let repState = _db.agents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: agentQuery,
  });
  await repState.awaitInitialReplication();

  repState = _db.talents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: talentQuery,
  });
  await repState.awaitInitialReplication();

  repState = _db.shows.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: showQuery,
  });
  await repState.awaitInitialReplication();

  repState = _db.tickets.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: ticketQuery,
  });
  await repState.awaitInitialReplication();

  repState = _db.showEvents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: showEventQuery,
  });
  await repState.awaitInitialReplication();

  await repState.awaitInitialReplication();

  repState = _db.transactions.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
    },
    query: transactionQuery,
  });
  await repState.awaitInitialReplication();

  _db.agents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: agentQuery,
  });

  _db.talents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: talentQuery,
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

  _db.tickets.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: ticketQuery,
  });

  _db.showEvents.syncCouchDB({
    remote: remoteDB,
    waitForLeadership: false,
    options: {
      retry: true,
      live: true,
    },
    query: showEventQuery,
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

  _agentDB.set(agentId, _db);
  return _db;
};

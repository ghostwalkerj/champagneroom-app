import {
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  PRIVATE_MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import {
  agentDocMethods,
  agentSchema,
  agentStaticMethods,
  type AgentCollection,
} from '$lib/ORM/models/agent';

import {
  ShowCollection,
  showDocMethods,
  showSchema,
} from '$lib/ORM/models/show';
import {
  ShowEventCollection,
  showEventSchema,
} from '$lib/ORM/models/showEvent';
import {
  talentDocMethods,
  talentSchema,
  type TalentCollection,
} from '$lib/ORM/models/talent';
import {
  TicketCollection,
  ticketDocMethods,
  ticketSchema,
} from '$lib/ORM/models/ticket';
import {
  TicketEventCollection,
  ticketEventSchema,
} from '$lib/ORM/models/ticketEvent';
import {
  transactionSchema,
  type TransactionCollection,
} from '$lib/ORM/models/transaction';
import { StorageTypes, initRXDB } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import jwt from 'jsonwebtoken';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';
import { PouchDB, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;

const token = jwt.sign(
  {
    exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
    sub: JWT_MASTER_DB_USER,
  },
  JWT_MASTER_DB_SECRET,
  { keyid: JWT_MASTER_DB_USER }
);

type MasterCollections = {
  agents: AgentCollection;
  talents: TalentCollection;
  tickets: TicketCollection;
  shows: ShowCollection;
  transactions: TransactionCollection;
  showEvents: ShowEventCollection;
  ticketEvents: TicketEventCollection;
};

export type MasterDBType = RxDatabase<MasterCollections>;
let _masterDB: MasterDBType;

export const masterDB = async () => {
  if (_masterDB) return _masterDB;

  initRXDB(StorageTypes.NODE_WEBSQL);

  const wrappedStorage = wrappedKeyEncryptionStorage({
    storage: getRxStoragePouch(StorageTypes.NODE_WEBSQL),
  });

  _masterDB = await createRxDatabase({
    name: 'pouchdb/pcall_db',
    storage: wrappedStorage,
    ignoreDuplicate: true,
    password: PUBLIC_RXDB_PASSWORD,
  });

  await _masterDB.addCollections({
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
    ticketEvents: {
      schema: ticketEventSchema,
    },
  });

  if (PRIVATE_MASTER_DB_ENDPOINT) {
    // Sync if there is a remote endpoint
    const remoteDB = new PouchDB(PRIVATE_MASTER_DB_ENDPOINT, {
      fetch: function (
        url: string,
        opts: { headers: { set: (arg0: string, arg1: string) => void } }
      ) {
        opts.headers.set('Authorization', 'Bearer ' + token);
        return PouchDB.fetch(url, opts);
      },
    });

    let repState = _masterDB.agents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
    });
    await repState.awaitInitialReplication();

    repState = _masterDB.talents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
    });
    await repState.awaitInitialReplication();

    repState = _masterDB.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
    });
    await repState.awaitInitialReplication();

    repState = _masterDB.showEvents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
    });
    await repState.awaitInitialReplication();

    repState = _masterDB.tickets.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
    });
    await repState.awaitInitialReplication();

    repState = _masterDB.ticketEvents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
    });
    await repState.awaitInitialReplication();

    repState = _masterDB.transactions.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
      },
    });
    await repState.awaitInitialReplication();

    _masterDB.agents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
    });
    _masterDB.talents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
    });
    _masterDB.shows.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
    });
    _masterDB.showEvents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
    });
    _masterDB.tickets.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
    });
    _masterDB.ticketEvents.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
    });
    _masterDB.transactions.syncCouchDB({
      remote: remoteDB,
      waitForLeadership: false,
      options: {
        retry: true,
        live: true,
      },
    });
  }
  return _masterDB;
};

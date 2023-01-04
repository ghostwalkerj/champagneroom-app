import { PUBLIC_PUBLIC_ENDPOINT, PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import { initRXDB, StorageTypes } from '$lib/ORM/rxdb';
import { EventEmitter } from 'events';
import { createRxDatabase, type RxDatabase } from 'rxdb';
import { wrappedKeyEncryptionStorage } from 'rxdb/plugins/encryption';

import { getRxStoragePouch, PouchDB } from 'rxdb/plugins/pouchdb';

import { showSchema, type ShowCollection } from '$lib/ORM/models/show';
import { ticketSchema, type TicketCollection, type TicketDocument } from '$lib/ORM/models/ticket';

// Sync requires more listeners but ok with http2
EventEmitter.defaultMaxListeners = 100;
type PublicCollections = {
	tickets: TicketCollection;
	shows: ShowCollection;
};

export type PublicTicketDBType = RxDatabase<PublicCollections>;
const _publicTicketDB = new Map<string, PublicTicketDBType>();
export const publicTicketDB = async (
	token: string,
	ticketId: string,
	storage: StorageTypes
): Promise<PublicTicketDBType> => await create(token, ticketId, storage);

const create = async (token: string, ticketId: string, storage: StorageTypes) => {
	let _db = _publicTicketDB.get(ticketId);
	if (_db) return _db;

	initRXDB(storage);

	const wrappedStorage = wrappedKeyEncryptionStorage({
		storage: getRxStoragePouch(storage)
	});

	_db = await createRxDatabase({
		name: 'pouchdb/publicTicket_db',
		storage: wrappedStorage,
		ignoreDuplicate: true,
		password: PUBLIC_RXDB_PASSWORD
	});

	await _db.addCollections({
		tickets: {
			schema: ticketSchema
		},
		shows: {
			schema: showSchema
		}
	});

	if (PUBLIC_PUBLIC_ENDPOINT) {
		// Sync if there is a remote endpoint
		const remoteDB = new PouchDB(PUBLIC_PUBLIC_ENDPOINT, {
			fetch: function (
				url: string,
				opts: { headers: { set: (arg0: string, arg1: string) => void; }; }
			) {
				opts.headers.set('Authorization', 'Bearer ' + token);
				return PouchDB.fetch(url, opts);
			}
		});
		const ticketQuery = _db.tickets.findOne(ticketId);

		let repState = _db.tickets.syncCouchDB({
			remote: remoteDB,
			waitForLeadership: false,
			options: {
				retry: true
			},
			query: ticketQuery
		});
		await repState.awaitInitialReplication();

		const _thisTicket = (await ticketQuery.exec()) as TicketDocument;
		if (_thisTicket) {

			const showQuery = _db.shows.findOne(_thisTicket.show);

			repState = _db.shows.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true
				},
				query: showQuery
			});
			await repState.awaitInitialReplication();

			_db.tickets.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: ticketQuery
			});

			_db.shows.syncCouchDB({
				remote: remoteDB,
				waitForLeadership: false,
				options: {
					retry: true,
					live: true
				},
				query: showQuery
			});
		}
	}
	_publicTicketDB.set(ticketId, _db);
	return _db;
};

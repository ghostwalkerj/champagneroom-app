import { parentPort } from 'node:worker_threads';
import process from 'node:process';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { serverDB } from 'plib/dist/ORM/dbs/serverDB';
import { DatabaseOptions, StorageType } from 'plib/dist/ORM/rxdb';

dotenv.config();
console.log('Starting TicketMachine Worker');

const {
  JWT_MASTER_DB_USER,
  JWT_MASTER_DB_SECRET,
  JWT_EXPIRY,
  PUBLIC_RXDB_PASSWORD,
  MASTER_DB_ENDPOINT,
} = process.env;

if (!JWT_MASTER_DB_USER) throw new Error('JWT_MASTER_DB_USER not set');
if (!JWT_MASTER_DB_SECRET) throw new Error('JWT_MASTER_DB_SECRET not set');
if (!JWT_EXPIRY) throw new Error('JWT_EXPIRY not set');
if (!PUBLIC_RXDB_PASSWORD) throw new Error('PUBLIC_RXDB_PASSWORD not set');
if (!MASTER_DB_ENDPOINT) throw new Error('MASTER_DB_ENDPOINT not set');

const token = jwt.sign(
  {
    exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
    sub: JWT_MASTER_DB_USER,
  },
  JWT_MASTER_DB_SECRET,
  { keyid: JWT_MASTER_DB_USER }
);

const dbOptions = {
  storageType: StorageType.NODE_WEBSQL,
  rxdbPassword: PUBLIC_RXDB_PASSWORD,
  endPoint: MASTER_DB_ENDPOINT,
} as DatabaseOptions;

const _serverDB = await serverDB(token, dbOptions);

// signal to parent that the job is done
if (parentPort) parentPort.postMessage('done');
// eslint-disable-next-line unicorn/no-process-exit
else process.exit(0);

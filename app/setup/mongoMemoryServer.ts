import { afterEach } from 'node:test';

import { MongoMemoryServer } from 'mongodb-memory-server';
// tests/db-handler.js
import mongoose from 'mongoose';
import { afterAll, beforeAll } from 'vitest';

let mongod: MongoMemoryServer;

/**
 * Connect to the in-memory database.
 */
const connect = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  return mongod;
};

/**
 * Drop database, close the connection and stop mongod.
 */
const closeDatabase = async (mongod: MongoMemoryServer) => {
  await mongoose.connection?.dropDatabase();
  await mongoose.connection?.close();
  await mongod?.stop();
};

const clearDatabase = async () => {
  if (!mongoose.connection) {
    return;
  }
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

beforeAll(async () => {
  mongod = await connect();
});

afterAll(async () => {
  await clearDatabase();
  await closeDatabase(mongod);
});

afterEach(async () => {
  await clearDatabase();
});

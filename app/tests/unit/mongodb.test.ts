import { MongoClient } from 'mongodb';
import { expect, it } from 'vitest';

it('connects to mongodb', () => {
  expect(async () => {
    const client = new MongoClient(
      (globalThis as { [key: string]: any }).__MONGO_URI__
    );
    try {
      const database = client.db('test');
      await database.command({ ping: 1 });
    } finally {
      await client.close();
    }
  }).not.toThrow();
});

it('inserts and reads a document', async () => {
  const client = new MongoClient(
    (globalThis as { [key: string]: any }).__MONGO_URI__
  );
  await client.connect();
  const database = client.db('test');
  const users = database.collection('users');
  await users.insertOne({ username: 'test123', password: 'test123' });
  const user = await users.findOne({ username: 'test123' });
  await client.close();

  expect(user).toHaveProperty('username');
  expect(user).toHaveProperty('password');
  expect(user?.username).toBe('test123');
  expect(user?.password).toBe('test123');
});

import PouchDB from 'pouchdb-node';
import type { RequestHandler } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
export const post: RequestHandler = async ({ request }) => {
  try {
    const localDB = new PouchDB('db/pcall');
    const remoteDB = new PouchDB('http://admin:admin@192.168.1.48:5984/pcall');
    const form = await request.formData();
    const name = form.get('name');
    const amount = form.get('amount');

    localDB.sync(remoteDB, {
      live: true,
      retry: true
    });

    if (typeof name !== 'string' || typeof amount !== 'string') {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Bad parameters.'
        }
      };
    }

    const doc = {
      _id: uuidv4(),
      name,
      amount,
      used: false,
      created_at: new Date().toISOString()
    };
    localDB.put(doc);
    return {
      status: 200,
      body: {
        success: true,
        id: doc._id
      }
    };
  } catch (error) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Bad things happened.'
      }
    };
  }
};

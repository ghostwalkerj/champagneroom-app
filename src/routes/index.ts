import PouchDB from 'pouchdb-node';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import PouchFind from 'pouchdb-find';
PouchDB.plugin(PouchFind);
type pCallLink = {
  _id: string;
  name: string;
  amount: string;
  expired: boolean;
  address: string;
  created_at: string;
};

const REMOTE_DB_URL = import.meta.env.VITE_REMOTE_COUCHDB_URL;
const LOCAL_DB_URL = import.meta.env.VITE_LOCAL_COUCHDB_URL;

const generateLink = (doc: pCallLink): string => {
  const link = import.meta.env.VITE_CALL_URL + '/' + doc._id;
  return link;
};

export const post: RequestHandler = async ({ request }) => {
  try {
    const localDB = new PouchDB(LOCAL_DB_URL);
    const remoteDB = new PouchDB(REMOTE_DB_URL);
    const form = await request.formData();
    const name = form.get('name');
    const amount = form.get('amount');
    const address = form.get('address');

    localDB.sync(remoteDB, {
      live: true,
      retry: true
    });


    if (typeof name !== 'string' || typeof amount !== 'string' || typeof address !== 'string') {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Bad parameters.'
        }
      };
    }

    const doc: pCallLink = {
      _id: 'id' + nanoid(),
      name,
      amount,
      address,
      expired: false,
      created_at: new Date().toISOString()
    };

    const expireDocs = await localDB.find({
      selector: { address, expired: false }
    }) as PouchDB.Find.FindResponse<pCallLink>;

    // expire any existing documents
    localDB.bulkDocs(expireDocs.docs.map(doc => ({ ...doc, expired: true })));

    localDB.put(doc);

    const link = generateLink(doc);
    return {
      status: 200,
      body: {
        success: true,
        link
      }
    };
  } catch (error) {
    return {
      status: 400,
      body: {
        success: false,
        error: error.message
      }
    };
  }
};

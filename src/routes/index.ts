import type { RequestHandler } from '@sveltejs/kit';
import { getDb, type PCallDocument } from 'lib/db';
import { nanoid } from 'nanoid';
import path from 'path';

const generateLink = (doc: PCallDocument): string => {
	const link = new URL(path.join(import.meta.env.VITE_CALL_URL, doc._id));
	return link.toString();
};

export const post: RequestHandler = async ({ request }) => {
	try {
		const db = getDb();
		const form = await request.formData();
		const name = form.get('name');
		const amount = form.get('amount');
		const address = form.get('address');

		if (typeof name !== 'string' || typeof amount !== 'string' || typeof address !== 'string') {
			return {
				status: 400,
				body: {
					success: false,
					error: 'Bad parameters.'
				}
			};
		}

		const doc: PCallDocument = {
			_id: 'id' + nanoid(),
			name,
			amount,
			address,
			expired: false,
			created_at: new Date().toISOString()
		};

		const expireDocs = (await db.find({
			selector: { address, expired: false }
		})) as PouchDB.Find.FindResponse<PCallDocument>;

		// expire any existing documents
		db.bulkDocs(expireDocs.docs.map(doc => ({ ...doc, expired: true })));

		db.put(doc);

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

import type { RequestHandler } from '@sveltejs/kit';
import { getDb, LinkDocument, linkSchema } from 'db';
import path from 'path';

const generateLink = (link: LinkDocument): string => {
	const url = new URL(path.join(import.meta.env.VITE_CALL_URL, link._id));
	return url.toString();
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

		const doc = new LinkDocument();
		doc.name = name;
		doc.amount = parseInt(amount);
		doc.address = address;

		linkSchema.parse(doc);

		await db.createIndex({
			index: {
				fields: ['address', 'expired']
			}
		});

		const expireDocs = (await db.find({
			selector: { address, expired: false }
		})) as PouchDB.Find.FindResponse<LinkDocument>;

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

import type { RequestHandler } from '@sveltejs/kit';
import { getDb, LinkDocument, linkSchema, type LinkDocumentType } from 'db';
import path from 'path';

const generateLinkURL = (link: LinkDocument): string => {
	const url = new URL(path.join(import.meta.env.VITE_TXN_URL, link._id));
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

		const linkDocument = new LinkDocument() as LinkDocumentType;
		linkDocument.name = name;
		linkDocument.amount = parseInt(amount);
		linkDocument.address = address;

		linkSchema.parse(linkDocument);

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

		db.put(linkDocument);

		const linkURL = generateLinkURL(linkDocument);
		return {
			status: 200,
			body: {
				success: true,
				linkURL
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

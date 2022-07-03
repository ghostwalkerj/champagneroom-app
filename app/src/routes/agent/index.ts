import { getDb } from 'db';
import { LinkDocument, LinkSchema, type LinkDocumentType } from 'db/models/link';

export const post = async ({ request }) => {
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
		linkDocument.amount = amount;
		linkDocument.address = address;

		LinkSchema.parse(linkDocument);

		await db.createIndex({
			index: {
				fields: ['address', 'expired']
			}
		});

		const expireDocs = (await db.find({
			selector: { address, expired: false }
		})) as PouchDB.Find.FindResponse<LinkDocument>;

		// expire any existing documents
		db.bulkDocs(expireDocs.docs.map((doc) => ({ ...doc, expired: true })));

		db.put(linkDocument);

		return {
			status: 200,
			body: {
				success: true,
				linkDocument
			}
		};
	} catch (error) {
		return {
			status: 400,
			body: {
				success: false,
				error
			}
		};
	}
};

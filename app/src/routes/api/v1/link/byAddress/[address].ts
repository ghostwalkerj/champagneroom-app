import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from 'db';
import type { LinkDocumentType } from 'db/models/link';
type GetParams = Record<string, string>;

export const get = async (event: RequestEvent<GetParams>) => {
	try {
		const address = event.params.address;
		const db = getDb();
		let linkDocument: LinkDocumentType = undefined;

		await db.createIndex({
			index: {
				fields: ['address', 'expired']
			}
		});

		const currentLink = (await db.find({
			selector: { address, expired: false },
			limit: 1
		})) as PouchDB.Find.FindResponse<LinkDocumentType>;

		if (currentLink.docs.length === 1) {
			linkDocument = currentLink.docs[0];
		}

		return {
			status: 200,
			body: {
				success: true,
				linkDocument
			}
		};
	} catch (error) {
		return {
			status: 200,
			body: {
				success: false,
				error: error.message,
				linkDocument: null
			}
		};
	}
};

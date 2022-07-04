import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from 'db';
import { LinkDocument, LinkStatus } from 'db/models/link';
type GetParams = Record<string, string>;

export const get = async (event: RequestEvent<GetParams>) => {
	try {
		const creatorId = event.params.creatorId;
		const db = getDb();
		let linkDocument: LinkDocument | null = null;

		await db.createIndex({
			index: {
				fields: ['creatorId', 'status', 'documentType']
			}
		});

		const currentLink = (await db.find({
			selector: { creatorId, status: LinkStatus.ACTIVE, documentType: LinkDocument.type },
			limit: 1
		})) as PouchDB.Find.FindResponse<LinkDocument>;

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
				linkDocument: null
			}
		};
	}
};

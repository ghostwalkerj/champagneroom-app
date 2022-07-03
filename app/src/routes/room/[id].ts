import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from 'db';
import type { LinkDocument } from 'db/models/link';
type GetParams = Record<string, string>;

export const get = async (event: RequestEvent<GetParams>) => {
	try {
		const id = event.params.id;
		const db = getDb();
		const linkDocument = (await db.get(id)) as LinkDocument;
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
				error: error,
				linkDocument: null
			}
		};
	}
};

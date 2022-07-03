import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from 'db';
import { CreatorDocument } from 'db/models/creator';
type GetParams = Record<string, string>;

export const get = async (event: RequestEvent<GetParams>) => {
	try {
		const id = CreatorDocument.type + ':' + event.params.id;
		const db = getDb();

		const creatorDocument = (await db.get(id)) as PouchDB.Find.FindResponse<CreatorDocument>;

		return {
			status: 200,
			body: {
				success: true,
				creatorDocument
			}
		};
	} catch (error) {
		return {
			status: 200,
			body: {
				success: false,
				creatorDocument: null
			}
		};
	}
};

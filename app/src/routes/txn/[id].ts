import type { RequestEvent, RequestHandler, ResponseBody } from '@sveltejs/kit';
import { getDb, type PCallDocument } from 'db';
type GetParams = Record<string, string>;

export const get: RequestHandler<GetParams, ResponseBody> = async (
	event: RequestEvent<GetParams>
) => {
	try {
		const id = event.params.id;
		const db = getDb();
		const pCallDocument: PCallDocument = await db.get(id);
		return {
			status: 200,
			body: {
				success: true,
				pCallDocument
			}
		};
	} catch (error) {
		return {
			status: 200,
			body: {
				success: false,
				error: error.message,
				pCallDocument: null
			}
		};
	}
};

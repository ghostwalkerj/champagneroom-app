import type { RequestEvent, RequestHandler, ResponseBody } from '@sveltejs/kit';
import { getDb, type pCallLink } from 'lib/db';
type GetParams = Record<string, string>;

export const get: RequestHandler<GetParams, ResponseBody> = async (
	event: RequestEvent<GetParams>
) => {
	try {
		const id = event.params.id;
		const db = getDb();
		const doc: pCallLink = await db.get(id);
		console.log(doc);
		return {
			status: 200,
			body: {
				success: true,
				doc
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

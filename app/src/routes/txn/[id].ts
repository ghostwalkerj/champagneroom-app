import type { RequestEvent, RequestHandler, ResponseBody } from '@sveltejs/kit';
import { getDb } from 'db';
import type { LinkType } from "db/models/Link";
type GetParams = Record<string, string>;

export const get: RequestHandler<GetParams, ResponseBody> = async (
	event: RequestEvent<GetParams>
) => {
	try {
		const id = event.params.id;
		const db = getDb();
		const linkDocument = (await db.get(id)) as LinkType;
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

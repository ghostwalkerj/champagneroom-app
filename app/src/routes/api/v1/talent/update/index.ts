import { getDb } from 'db';
import type { TalentDocument } from 'db/models/talent';

export const put = async ({ request }) => {
	const talent = await request.json();
	const db = getDb();

	db.put<TalentDocument>(talent);

	return {
		status: 204
	};
};

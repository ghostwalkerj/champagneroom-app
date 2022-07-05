import { getDb } from 'db';
import { TalentDocument, TalentSchema } from 'db/models/talent';

export const post = async ({ request }) => {
	try {
		const db = getDb();
		const form = await request.formData();
		const agentId = form.get('agentId');
		const name = form.get('name');
		const talentKey = form.get('talentKey');
		if (typeof agentId !== 'string' || typeof name !== 'string' || typeof talentKey !== 'string') {
			return {
				status: 400,
				body: {
					success: false,
					error: 'Bad parameters.'
				}
			};
		}
		const talentDocument = new TalentDocument(agentId, name, talentKey);

		TalentSchema.parse(TalentDocument);
		db.put(talentDocument);
		return {
			status: 200,
			body: {
				success: true,
				talentDocument
			}
		};
	} catch (error) {
		console.log(error);
		return {
			status: 400,
			body: {
				success: false,
				error: error
			}
		};
	}
};

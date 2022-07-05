import { getDb } from 'db';
import { CreatorDocument, CreatorSchema } from 'db/models/creator';

export const post = async ({ request }) => {
	try {
		const db = getDb();
		const form = await request.formData();
		const agentId = form.get('agentId');
		const name = form.get('name');
		if (typeof agentId !== 'string' || typeof name !== 'string') {
			return {
				status: 400,
				body: {
					success: false,
					error: 'Bad parameters.'
				}
			};
		}
		const creatorDocument = new CreatorDocument(agentId, name);

		CreatorSchema.parse(creatorDocument);
		db.put(creatorDocument);
		return {
			status: 200,
			body: {
				success: true,
				creatorDocument
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

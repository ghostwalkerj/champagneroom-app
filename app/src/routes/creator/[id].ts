import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from 'db';
import { CreatorDocument } from 'db/models/creator';
import { LinkDocument, LinkSchema, LinkStatus } from 'db/models/link';
type GetParams = Record<string, string>;

export const get = async (event: RequestEvent<GetParams>) => {
	try {
		const id = CreatorDocument.type + ':' + event.params.id;
		const db = getDb();
		const creatorDocument = (await db.get(id)) as PouchDB.Find.FindResponse<CreatorDocument>;

		if (creatorDocument.docs.length === 1) {
			const creator = creatorDocument.docs[0];
			const linkDocument = (await db.find({
				selector: {
					creatorId: creator._id,
					status: LinkStatus.ACTIVE,
					documentType: LinkDocument.type
				},
				limit: 1
			})) as PouchDB.Find.FindResponse<LinkDocument>;

			if (linkDocument.docs.length != 0) {
				creator.currentLink = linkDocument.docs[0];
			}

			return {
				status: 200,
				body: {
					success: true,
					creatorDocument
				}
			};
		}
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

export const post = async ({ request }) => {
	try {
		const db = getDb();
		const form = await request.formData();
		const creatorId = form.get('creatorId');
		const amount = form.get('amount');
		if (typeof creatorId !== 'string' || typeof amount !== 'string') {
			return {
				status: 400,
				body: {
					success: false,
					error: 'Bad parameters.'
				}
			};
		}
		const linkDocument = new LinkDocument(
			creatorId,
			'0x251281e1516e6E0A145d28a41EE63BfcDd9E18Bf', // TODO: Generate
			amount
		);

		LinkSchema.parse(linkDocument);
		await db.createIndex({
			index: {
				fields: ['creatorId', 'status', 'documentType']
			}
		});
		const expireDocs = (await db.find({
			selector: { creatorId, status: LinkStatus.ACTIVE, documentType: LinkDocument.type }
		})) as PouchDB.Find.FindResponse<LinkDocument>;
		// expire any existing documents
		db.bulkDocs(expireDocs.docs.map((doc) => ({ ...doc, status: LinkStatus.EXPIRED })));
		db.put(linkDocument);
		return {
			status: 200,
			body: {
				success: true,
				linkDocument
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

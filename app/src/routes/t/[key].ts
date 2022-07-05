import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from 'db';
import { TalentDocument } from 'db/models/talent';
import { LinkDocument, LinkSchema, LinkStatus } from 'db/models/link';
type GetParams = Record<string, string>;

export const get = async (event: RequestEvent<GetParams>) => {
	try {
		const key = event.params.key;
		const db = getDb();
		await db.createIndex({
			index: {
				fields: ['talentKey', 'documentType']
			}
		});

		const talentResponse = (await db.find({
			selector: {
				talentKey: key,
				documentType: TalentDocument.type
			},
			limit: 1
		})) as PouchDB.Find.FindResponse<TalentDocument>;

		const talentDocument = talentResponse.docs[0]; //TODO: Throw Error

		await db.createIndex({
			index: {
				fields: ['talentId', 'status', 'documentType']
			}
		});

		const linkDocument = (await db.find({
			selector: {
				talentId: talentDocument._id,
				status: LinkStatus.ACTIVE,
				documentType: LinkDocument.type
			},
			limit: 1
		})) as PouchDB.Find.FindResponse<LinkDocument>;

		if (linkDocument.docs.length != 0) {
			talentDocument.currentLink = linkDocument.docs[0];
		}

		return {
			status: 200,
			body: {
				success: true,
				talentDocument
			}
		};
	} catch (error) {
		return {
			status: 200,
			body: {
				success: false,
				talentDocument: null
			}
		};
	}
};

export const post = async ({ request }) => {
	try {
		const db = getDb();
		const form = await request.formData();
		const talentId = form.get('talentId');
		const amount = form.get('amount');
		if (typeof talentId !== 'string' || typeof amount !== 'string') {
			return {
				status: 400,
				body: {
					success: false,
					error: 'Bad parameters.'
				}
			};
		}
		const linkDocument = new LinkDocument(
			talentId,
			'0x251281e1516e6E0A145d28a41EE63BfcDd9E18Bf', // TODO: Generate
			amount
		);

		LinkSchema.parse(linkDocument);
		await db.createIndex({
			index: {
				fields: ['talentId', 'status', 'documentType']
			}
		});
		const expireDocs = (await db.find({
			selector: { talentId, status: LinkStatus.ACTIVE, documentType: LinkDocument.type }
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

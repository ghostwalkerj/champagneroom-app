import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from 'db';
import { AgentDocument } from 'db/models/agent';
import { CreatorDocument } from 'db/models/creator';
type GetParams = Record<string, string>;

export const get = async (event: RequestEvent<GetParams>) => {
	try {
		const address = event.params.address;
		const db = getDb();
		let creators: CreatorDocument[] = [];
		await db.createIndex({
			index: {
				fields: ['address', 'documentType']
			}
		});
		await db.createIndex({
			index: {
				fields: ['agentId', 'documentType']
			}
		});

		const agentDocs = (await db.find({
			selector: { address, documentType: AgentDocument.type }
		})) as PouchDB.Find.FindResponse<CreatorDocument>;

		if (agentDocs.docs.length > 0) {
			const agent = agentDocs[0];
			const creatorDocs = (await db.find({
				selector: { agentId: agent._id, documentType: CreatorDocument.type }
			})) as PouchDB.Find.FindResponse<CreatorDocument>;
			creators = creatorDocs.docs;
			agent.creators = creators;
			return {
				status: 200,
				body: {
					success: true,
					agent
				}
			};
		} // TODO: Create an agent if it doesn't exist
	} catch (error) {
		return {
			status: 200,
			body: {
				success: false,
				agent: null
			}
		};
	}
};

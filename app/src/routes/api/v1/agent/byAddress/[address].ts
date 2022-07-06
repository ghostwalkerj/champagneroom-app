import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from 'db';
import { AgentDocument } from 'db/models/agent';
import { TalentDocument } from 'db/models/talent';
type GetParams = Record<string, string>;
export const prerender = false; // because depends if we have a valid agent
export const get = async (event: RequestEvent<GetParams>) => {
	try {
		const address = event.params.address;
		const db = getDb();
		let talents: TalentDocument[] = [];
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
		})) as PouchDB.Find.FindResponse<AgentDocument>;

		if (agentDocs.docs.length > 0) {
			const agent = agentDocs.docs[0];
			const talentDocs = (await db.find({
				selector: { agentId: agent._id, documentType: TalentDocument.type }
			})) as PouchDB.Find.FindResponse<TalentDocument>;
			if (talentDocs.docs.length > 0) {
				talents = talentDocs.docs;
				agent.talents = talents;
			}
			return {
				status: 200,
				body: {
					success: true,
					agent
				}
			};
		} // Create Agent
		else {
			const agent = new AgentDocument(address);
			db.put(new AgentDocument(address));
			return {
				status: 200,
				body: {
					success: true,
					agent
				}
			};
		} //
	} catch (error) {
		console.log(error);
		return {
			status: 200,
			body: {
				success: false,
				agent: null
			}
		};
	}
};

import * as yup from 'yup';
import { createModelBase, type ModelBase } from './modelBase';

export const AgentSchema = yup.object({
	address: yup.string().required().min(40),
	walletAddress: yup.string().optional(),
	talents: yup.array().optional()
});

export type AgentBase = yup.InferType<typeof AgentSchema>;
export type Agent = AgentBase & ModelBase;
export const AgentType = 'agent';

export const AgentById = AgentType + 'ById';
export const AgentByAddress = AgentType + 'ByAddress';

export const createAgent = (_agent: AgentBase) => {
	const base = createModelBase(AgentType);
	const agent = {
		...base,
		..._agent
	};
	return agent;
};

import validator from 'validator';
import { z } from 'zod';
import { createModelBase, type ModelBase } from './modelBase';

export const AgentSchema = z.object({
	address: z.string().refine((x) => {
		return validator.isEthereumAddress(x);
	}),
	walletAddress: z
		.string()
		.refine((x) => validator.isEthereumAddress(x), { message: 'Invalid Wallet Address' })
		.optional(),
	talents: z.set(z.any()).optional()
});

export type AgentBase = z.infer<typeof AgentSchema>;
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

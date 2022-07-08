import validator from 'validator';
import { z } from 'zod';
import { createDocumentBase, type DocumentBase as DocumentBase } from './documentBase';

export const AgentSchema = z.object({
	address: z.string().refine((x) => {
		return validator.isEthereumAddress(x);
	}),
	walletAddress: z
		.string()
		.refine((x) => validator.isEthereumAddress(x), { message: 'Invalid Wallet Address' })
		.optional(),
	talents: z.set(z.string(), z.any()).optional()
});

export type Agent = z.infer<typeof AgentSchema> & DocumentBase;
export const AgentType = 'agent';

export const createAgent = (address: string) => {
	const base = createDocumentBase(AgentType);
	const agent = {
		...base,
		address,
		walletAddress: address,
		talents: {}
	};
	return agent;
};

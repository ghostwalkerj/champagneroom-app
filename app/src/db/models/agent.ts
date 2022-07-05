import validator from 'validator';
import { z } from 'zod';
import type { TalentDocument } from './talent';
import { DocumentBase } from './documentBase';

export const AgentSchema = z.object({
	address: z.string().refine((x) => {
		return validator.isEthereumAddress(x);
	}),
	walletAddress: z
		.string()
		.refine((x) => {
			return validator.isEthereumAddress(x);
		})
		.optional()
});

export type AgentType = z.infer<typeof AgentSchema>;

export class AgentDocument extends DocumentBase implements AgentType {
	public address: string;
	public walletAddress?: string;
	public talents?: TalentDocument[];
	public static type = 'agent';
	constructor(address: string) {
		super(AgentDocument.type);
		this.address = address;
	}
}

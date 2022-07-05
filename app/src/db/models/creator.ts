import validator from 'validator';
import { z } from 'zod';
import type { AgentDocument } from './agent';
import { DocumentBase } from './documentBase';
import type { LinkDocument } from './link';

export const CreatorSchema = z.object({
	agentId: z.string().min(21),
	walletAddress: z
		.string()
		.refine((x) => {
			return validator.isEthereumAddress(x);
		})
		.optional(),
	name: z.string().min(3).max(20),
	profileImageUrl: z
		.string()
		.refine((x) => {
			return validator.isURL(x);
		})
		.optional(),
	feedBackAvg: z
		.string()
		.refine((x) => {
			return validator.isInt(x, { min: 0, max: 5 });
		})
		.optional(),
	agentCommission: z
		.string()
		.refine((x) => {
			return validator.isInt(x, { min: 0, max: 100 });
		})
		.optional()
});

export type CreatorType = z.infer<typeof CreatorSchema>;

export class CreatorDocument extends DocumentBase implements CreatorType {
	public agentId: string;
	public name: string;
	public walletAddress?: string;
	public profileImageUrl?: string;
	I;
	public feedBackAvg?: string;
	public agentCommission?: string;
	public currentLink?: LinkDocument;
	public agent?: AgentDocument;
	public static type = 'creator';
	constructor(agentId: string, name: string) {
		super(CreatorDocument.type);
		this.agentId = agentId;
		this.name = name;
	}
}

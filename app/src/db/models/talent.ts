import validator from 'validator';
import { z } from 'zod';
import type { AgentDocument } from './agent';
import { DocumentBase } from './documentBase';
import type { LinkDocument } from './link';

export const TalentSchema = z.object({
	agentId: z.string().min(21),
	name: z.string().min(3).max(20),
	talentKey: z.string().min(21),
	walletAddress: z
		.string()
		.refine((x) => validator.isEthereumAddress(x), { message: 'Invalid Wallet Address' })
		.optional(),
	profileImageUrl: z
		.string()
		.refine((x) => validator.isURL(x))
		.optional(),
	feedBackAvg: z
		.string()
		.refine((x) => validator.isInt(x, { min: 0, max: 5 }))
		.optional(),
	agentCommission: z
		.string()
		.refine((x) => validator.isInt(x, { min: 0, max: 100 }))
		.optional()
});

export type TalentType = z.infer<typeof TalentSchema>;

export class TalentDocument extends DocumentBase implements TalentType {
	public agentId: string;
	public talentKey: string;
	public name: string;
	public walletAddress?: string;
	public profileImageUrl?: string;

	public feedBackAvg?: string;
	public agentCommission?: string;
	public currentLink?: LinkDocument;
	public agent?: AgentDocument;
	public static type = 'talent';
	constructor(agentId: string, name: string, talentKey: string) {
		super(TalentDocument.type);
		this.agentId = agentId;
		this.name = name;
		this.talentKey = talentKey;
	}
}

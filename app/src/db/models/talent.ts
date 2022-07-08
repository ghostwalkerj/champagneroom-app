import validator from 'validator';
import { z } from 'zod';
import { createDocumentBase, type DocumentBase } from './documentBase';

export const TalentSchema = z.object({
	agentId: z.string().min(21),
	name: z.string().min(3).max(20),
	key: z.string().min(21),
	walletAddress: z
		.string()
		.refine((x) => validator.isEthereumAddress(x), { message: 'Invalid Wallet Address' })
		.optional(),
	profileImageUrl: z
		.string()
		.refine((x) => validator.isURL(x))
		.optional(),
	feedBackAvg: z.number().min(0).max(5).optional(),
	agentCommission: z.number().min(0).max(100).int().optional(),
	currentLink: z.any().optional()
});

export type Talent = z.infer<typeof TalentSchema> & DocumentBase;
export const TalentType = 'talent';

export const createTalent = (agentId: string, name: string, key: string): Talent => {
	const base = createDocumentBase(TalentType);
	const talent = {
		...base,
		agentId,
		name,
		key
	};
	return talent;
};

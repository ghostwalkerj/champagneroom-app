import validator from 'validator';
import { z } from 'zod';
import { createModelBase, type ModelBase } from './modelBase';

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
	currentLinkId: z.string().optional()
});

export type TalentBase = z.infer<typeof TalentSchema>;
export type Talent = TalentBase & ModelBase;
export const TalentType = 'talent';
export const TalentById = TalentType + 'ById';
export const TalentByKey = TalentType + 'ByKey';

export const createTalent = (_talent: TalentBase): Talent => {
	const base = createModelBase(TalentType);
	const talent = {
		...base,
		..._talent,
		feedBackAvg: 0
	};
	return talent;
};

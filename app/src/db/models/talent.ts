import { DEFAULT_PROFILE_IMAGE } from 'lib/constants';
import * as yup from 'yup';
import { createModelBase, type ModelBase } from './modelBase';
export const TalentSchema = yup.object({
	agentId: yup.string().min(21).required(),
	name: yup.string().min(3).max(20).required(),
	key: yup.string().min(21).required(),
	walletAddress: yup.string().nullable(),
	profileImageUrl: yup.string().default(DEFAULT_PROFILE_IMAGE).required(),
	feedBackAvg: yup.number().integer().min(0).max(5).default(0).required(),
	agentCommission: yup.number().integer().min(0).max(100).default(0).required(),
	currentLinkId: yup.string().nullable()
});

export type TalentBase = yup.InferType<typeof TalentSchema>;
export type Talent = TalentBase & ModelBase;
export const TalentType = 'talent';
export const TalentById = TalentType + 'ById';
export const TalentByKey = TalentType + 'ByKey';

export const createTalent = (_talent: TalentBase): Talent => {
	const base = createModelBase(TalentType);
	const talent = {
		...base,
		..._talent
	};
	return talent;
};

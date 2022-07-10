import { createModelBase, type ModelBase } from './modelBase';
import * as yup from 'yup';

export const FeedbackSchema = yup.object({
	linkId: yup.string().min(21).required(),
	talentId: yup.string().min(21).required(),
	rejectedCount: yup.number().integer().required().positive().default(0),
	disconnectCount: yup.number().integer().required().positive().default(0),
	notAnsweredCount: yup.number().integer().required().positive().default(0),
	rating: yup.number().min(0).max(5).default(0)
});

export type FeedbackBase = yup.InferType<typeof FeedbackSchema>;
export type Feedback = FeedbackBase & ModelBase;

export const FeedbackType = 'feedback';

export const FeedbackById = FeedbackType + 'ById';
export const FeedbackByLinkId = FeedbackType + 'ByLinkId';

export const createFeedback = (_feedback: FeedbackBase) => {
	const base = createModelBase(FeedbackType);
	const feedback = {
		...base,
		..._feedback
	};
	return feedback;
};

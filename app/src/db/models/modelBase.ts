import { nanoid } from 'nanoid';
import * as yup from 'yup';

export const ModelBase = yup.object({
	_id: yup.string().min(21).required(),
	createdAt: yup.string().required(),
	documentType: yup.string().min(1).required()
});

export type ModelBase = yup.InferType<typeof ModelBase>;

export const createModelBase = (type: string): ModelBase => {
	const base: ModelBase = {
		createdAt: new Date().toISOString(),
		documentType: type,
		_id: type + ':' + nanoid()
	};
	return base;
};

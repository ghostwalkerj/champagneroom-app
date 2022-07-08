import { nanoid } from 'nanoid';
import validator from 'validator';
import { z } from 'zod';

export const ModelBase = z.object({
	_id: z.string().min(21),
	createdAt: z
		.string()
		.default(new Date().toISOString())
		.refine((x) => {
			return validator.isDate(x);
		}),
	documentType: z.string().min(1)
});

export type ModelBase = z.infer<typeof ModelBase>;

export const createModelBase = (type: string): ModelBase => {
	const base: ModelBase = {
		createdAt: new Date().toISOString(),
		documentType: type,
		_id: type + ':' + nanoid()
	};
	return base;
};

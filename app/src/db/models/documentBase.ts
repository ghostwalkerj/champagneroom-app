import { nanoid } from 'nanoid';
import validator from 'validator';
import { z } from 'zod';

export const DocumentBaseSchema = z.object({
	_id: z.string().min(21),
	createdAt: z
		.string()
		.default(new Date().toISOString())
		.refine((x) => {
			return validator.isDate(x);
		}),
	documentType: z.string().min(1)
});

export type DocumentBase = z.infer<typeof DocumentBaseSchema>;

export const createDocumentBase = (type: string): DocumentBase => {
	const base: DocumentBase = {
		createdAt: new Date().toISOString(),
		documentType: type,
		_id: type + ':' + nanoid()
	};
	return base;
};

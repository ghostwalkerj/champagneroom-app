import { nanoid } from 'nanoid';
import validator from 'validator';
import { z } from 'zod';

export const DocumentBaseSchema = z.object({
	_id: z.string().min(21),
	createdAt: z
		.string()
		.optional()
		.default(new Date().toISOString())
		.refine((x) => {
			return validator.isDate(x);
		}),
	documentType: z.string().min(1)
});

export type DocumentBaseType = z.infer<typeof DocumentBaseSchema>;

export abstract class DocumentBase implements DocumentBaseType {
	public createdAt: string;
	public _id: string;
	public documentType: string;

	constructor(documentType: string) {
		this.createdAt = new Date().toISOString();
		this.documentType = documentType;
		this._id = documentType + ':' + nanoid();
	}
}

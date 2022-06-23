import { nanoid } from 'nanoid';
export * from './Link';

export abstract class DocumentBase {
	public created_at: string;
	public _id: string;
	public document_type: string;

	constructor (type: string) {
		this.created_at = new Date().toISOString();
		this.document_type = type;
		this._id = type + ':' + nanoid();
	}
}


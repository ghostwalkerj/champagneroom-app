import { nanoid } from 'nanoid';

export abstract class Entity {
	public created_at: string;
	public _id: string;
	public entity_type: string;

	constructor(type: string) {
		this.created_at = new Date().toISOString();
		this.entity_type = type;
		this._id = type + ':' + nanoid();
	}
}

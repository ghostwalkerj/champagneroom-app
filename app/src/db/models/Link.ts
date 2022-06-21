import {
	IsBoolean,
	IsEthereumAddress,
	IsInt,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength
} from 'class-validator';
import { nanoid } from 'nanoid';
import { PouchCollection, PouchModel } from 'pouchorm';

export class Link extends PouchModel<Link> {
	@MinLength(3)
	@MaxLength(30)
	@IsString()
	name: string;

	@IsInt()
	@Min(1)
	@Max(1000)
	amount: number;

	@IsBoolean()
	expired: boolean;

	@IsEthereumAddress()
	address: string;

	async afterInit(): Promise<void> {
		this.expired = false;
	}
}

export class LinkCollection extends PouchCollection<Link> {
	async beforeInit(): Promise<void> {
		await this.addIndex(['address', 'expired']); // be sure to create an index for what you plan to filter by.
	}

	//async afterInit(): Promise<void> {}

	idGenerator = async (): Promise<string> => {
		return 'link:' + nanoid();
	};
}

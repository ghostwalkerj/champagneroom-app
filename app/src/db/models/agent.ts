import validator from 'validator';
import { z } from 'zod';
import { CreatorDocument, CreatorSchema } from './creator';
import { DocumentBase } from './documentBase';

export const AgentSchema = z.object({
	address: z.string().refine((x) => {
		return validator.isEthereumAddress(x);
	}),
	creators: z.array(CreatorSchema).optional()
});

export type AgentType = z.infer<typeof AgentSchema>;

export class AgentDocument extends DocumentBase implements AgentType {
	public address: string;

	public creators?: CreatorDocument[];

	public static type = 'creator';

	constructor(address: string) {
		super(AgentDocument.type);
		this.address = address;
	}
}

import validator from 'validator';
import { z } from 'zod';
import { DocumentBase } from '.';

export const CreatorSchema = z.object({
	agentId: z.string().min(21),
	walletAddress: z.string().refine((x) => {
		return validator.isEthereumAddress(x);
	}),
	name: z.string().min(3).max(20),
	profileImageUrl: z
		.string()
		.refine((x) => {
			return validator.isURL(x);
		})
		.optional(),
	feedBackAvg: z
		.string()
		.refine((x) => {
			return validator.isInt(x, { min: 0, max: 5 });
		})
		.optional()
});

export type CreatorType = z.infer<typeof CreatorSchema>;

export class CreatorDocument extends DocumentBase implements CreatorType {
	public agentId: string;
	public name: string;
	public walletAddress: string;

	public profileImageUrl?: string;

	public feedBackAvg?: string;

	public static type = 'creator';

	constructor(agentId: string, name: string, walletAddress: string) {
		super(CreatorDocument.type);
		this.agentId = agentId;
		this.walletAddress = walletAddress;
		this.name = name;
	}
}

export enum TokenRoles {
	ADMIN,
	PUBLIC,
	AGENT,
	TALENT
}

export const currencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0
});

import type { LinkDocType } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { createMachine, interpret, assign } from 'xstate';
import { LinkStatuses } from '$lib/ORM/models/link';

type LinkStateType = LinkDocType['state'];

export const createLinkMachine = (linkState: LinkStateType) => {
	/** @xstate-layout N4IgpgJg5mDOIC5QBsCWA7A1gWQIYGMALDMAOjSwAJkB7XCSAYkVAAcbZUAXVG9FkAA9EARgAMIgBykxksQE4AzGIBsAFgBMIgOyTJAGhABPRIpXzSmkSI3aArGM2z1AXxeGKOAsXRkAruj4yLioALZMAMIAMgCCAJLYAuycPHwCwggiamJ2pIpK+fIaaiKKUoYmCBrVpEXWGkqSyjo5bh4YXkQkpAFBIeEQjABKAKIAigCqIwDKACqUETEAchEjUbGzcQDyS0kc3Lz8SEKi2bn5ioXFpeXGiGraYrVa4tUlGooPbSCeeF2+pD6YUgpAA7iEeOgoGoAGIBCAYKDDcZTOYLZardYxTY7PYpQ7pRAqOy5SRqYlqSl2FRifIqCqIeRibTPay0iRqal2DTfX7ebpAgZgiGI2HwxGMAAKMQAmtgRkt5qNVnEAGojAAieIOaWOGREdkULLJxI+aiKcg09LuVUU0jqNm5IhU9lkdl5HT+PjIgpB4IOULF6ARUOYx2SOqOoH12kUuQkZLEOXMkg0jgZmTsalZCk5ajMKiyHqwXu6ACcwABHPxwLiQCK4QJgZDBVLoYUB6FDMAAM3hyJhEyWGsocWm0ymWvD+zbhMyNhUpBUtke8nJ2mX8gMNskG8sL2U8m0adKimLnW9pAr1dr9cb+GbrcOYbYM4JetEC6XK9zLs328qIpsysRxC0kLJFA0SRz1LAFwUhaEYQwXA0AAL1wNtGBhEZNQAIRiCIAGlKGVEY1U1bVZw-TIExkOQlFUKxdAA0wtH3axxDjZlikkFQYP5OCMNFJD0BQ1B0MwmYIiGLYAHVKBhOIljHAAJCjp3xXVo1EWjZAUZR1C0ZiM1sRR2KyEpzFMnl3B+T0BLIeDhOQtChL4RgNTHSUJlmEZR2UzZsXU19NKjE4EBdUlySzKkaTpDNIIsB0pCKbRyRUaDvnQGgGHgY4+X+MhPGoOgGAgSj320iLmTyXjCzKWNnU0DMXWkF0rVjdQMt3bR+MKnpAmCYFyo0yM5xsbQWSAjKxGKEoMweRcHTTfMVHMS41D6y9fQgDsEKDEMoAqrTwoNOwRBkEoyXJWkbDUBLlBzSLHEpLctoFIahXwRsGxbY6wv1NcNFqBRaTtaojw+DMpGAl5qm5RjPnegEdv+8bzrMk1uU+C1ZutSpU1ZUp5BULi7HkA1kbIa8a1gOsIAbJsWzc9t-X27s+2DNHqNS0htHkEmVqZE9tAzNczJAtKDTJLJetsgrLxp28GfvR8We5qqmTM-nBccYWJFFndtAuqxrCArdHSp4V9pEsSJMOUgMA1VBYFYPw6w18LeJZBxbEkJQYrKFiEE+MzkqtFoDWKK2nMDW3XKokKxuo4kLqxylOTikmTM5InSlAppijPeX7P676meQSBPf1MoLuXDd5AcPQ7S3MXDXY2lJG5BpbHdEuSwc0gexc8Sq9GxPTuqaRdGyRqBdTUmEtUcyOTSkoSSp6vEDsJparWm5GsM6GngdMwJCPcC+LcFwgA */
	return createMachine(
		{
			context: { linkState: linkState, errorMessage: undefined as string | undefined },
			tsTypes: {} as import('./linkMachine.typegen').Typegen0,
			schema: {
				events: {} as
					| { type: 'CLAIM'; claim: NonNullable<LinkStateType['claim']> }
					| { type: 'REQUEST CANCELLATION'; cancel: NonNullable<LinkStateType['cancel']> }
					| { type: 'REFUND ISSUED' }
					| {
							type: 'PAYMENT RECEIVED';
							transaction: TransactionDocType;
					  }
					| { type: 'CALL CONNECTED' }
					| { type: 'CALL DISCONNECTED' }
					| {
							type: 'CALL ACCEPTED';
							connection: NonNullable<LinkStateType['connections']>[0];
					  }
					| { type: 'FEEDBACK RECEIVED' }
					| { type: 'ESCROW FINISHED' }
					| {
							type: 'DISPUTE INITIATED';
							dispute: NonNullable<LinkStateType['dispute']>;
					  }
			},
			predictableActionArguments: true,
			id: 'linkMachine',
			initial: 'link loaded',
			states: {
				'link loaded': {
					always: [
						{
							cond: 'linkUnclaimed',
							target: 'unclaimed'
						},
						{
							cond: 'linkClaimed',
							target: 'claimed'
						},
						{
							cond: 'linkCancelled',
							target: 'cancelled'
						},
						{
							cond: 'linkFinalized',
							target: 'finalized'
						}
					]
				},
				unclaimed: {
					on: {
						CLAIM: {
							target: 'claimed'
						},
						'REQUEST CANCELLATION': {
							actions: 'cancelCall',
							target: 'cancelled'
						}
					}
				},
				claimed: {
					initial: 'waiting4Funding',
					states: {
						waiting4Funding: {
							always: {
								cond: 'fullyFunded',
								target: 'canCall'
							},
							on: {
								'REQUEST CANCELLATION': {
									actions: 'cancelCall',
									target: '#linkMachine.requestedCancellation'
								},
								'PAYMENT RECEIVED': {
									actions: 'sendPayment',
									target: 'waiting4Funding'
								}
							}
						},
						canCall: {}
					}
				},
				requestedCancellation: {
					initial: 'waiting4Refund',
					states: {
						waiting4Refund: {
							on: {
								'REFUND ISSUED': {
									target: '#linkMachine.cancelled'
								}
							}
						}
					},
					always: {
						cond: (context) => context.linkState.totalFunding === 0,
						target: 'cancelled'
					}
				},
				wating4Finalization: {
					states: {
						inDispute: {}
					},
					on: {
						'FEEDBACK RECEIVED': {
							target: 'finalized'
						},
						'ESCROW FINISHED': {
							target: 'finalized'
						},
						'DISPUTE INITIATED': {
							actions: 'initiateDispute',
							target: '.inDispute'
						}
					}
				},
				cancelled: {
					type: 'final'
				},
				finalized: {
					type: 'final'
				}
			}
		},
		{
			actions: {
				cancelCall: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatuses.CANCELED,
							cancel: event.cancel
						}
					};
				}),

				sendPayment: (context, event) => {
					context.linkState.claim?.transactions.push(event.transaction._id);
					context.linkState.totalFunding += Number.parseInt(event.transaction.value);
				},

				initiateDispute: (context, event) => {
					context.linkState.dispute = event.dispute;
				}
			},
			guards: {
				linkUnclaimed: (context) => context.linkState.status === LinkStatuses.UNCLAIMED,
				linkCancelled: (context) => context.linkState.status === LinkStatuses.CANCELED,
				linkFinalized: (context) => context.linkState.status === LinkStatuses.FINALIZED,
				linkClaimed: (context) => context.linkState.status === LinkStatuses.CLAIMED,
				fullyFunded: (context) => context.linkState.totalFunding >= context.linkState.minFunding
			}
		}
	);
};

export const createLinkMachineService = (linkState: LinkStateType) => {
	const linkMachine = createLinkMachine(linkState);
	return interpret(linkMachine).start();
};

export type LinkMachineType = ReturnType<typeof createLinkMachine>;
export type LinkMachineService = ReturnType<typeof createLinkMachineService>;

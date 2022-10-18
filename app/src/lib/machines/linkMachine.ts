import type { LinkDocType } from '$lib/ORM/models/link';
import { LinkStatuses } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

type LinkStateType = LinkDocType['state'];

type StateCallBackType = (state: LinkStateType) => void;

export const createLinkMachine = (linkState: LinkStateType, saveState?: StateCallBackType) => {
	const stateCallback = saveState;

	/** @xstate-layout N4IgpgJg5mDOIC5QBsCWA7A1gWQIYGMALDMAOjSwAJkB7XCSAYgG0AGAXUVAAcbZUALqhrouIAB6IALAGYppAEwA2AKxKZARiVKA7FJUAOBQBoQAT2kKFpVRtYqAnBocGDUgw6kBfL6Yo4CYnQyf2o6BggWDU4kEF5+IRExSQQpNMVVdS1dfSNTCwQFFR1SKQdygy0VMrUpJR8-DACiEnImsPomZgUYnj5BYVFYlLT5ZTVNbT1DE3NEI1JypakrWRVWGQaQfzwW4LaqWk7I5hleuP7EodARhTHMyZyZ-OklAxsVOxlWAx0HHRkmi2O0CrQAruh8MhcKgALZMADCABkAIIASWwbHO8QGSWGiD+MlIrB0lQcgJUMgc1VmBRkOhUiyWnl0Gz0DmBTV2QTIEKhMPhkQASgBRACKAFURQBlAAqlARKIAcgiRUjUbK0QB5JVYsQ4q7JRAqWmIDQaBQlDSfLR2aoOO4GTlYbmtflwyCkADuMKE6CgUgAYhCIBgoIxRZKZfLFSq1RrtbqOPrLoMjQglKaENTGR5ARopObWMWVCpnc0eaR3YLvb6w0GQ2HGAAFFEATWwIqV8tFqrRADURQARPWxA1p-HZpylek6a2-JTUvJzQq-UrMuo6Nllcuu-bVz0+gb+hvoUP+ljJsepvE3M3OJQ2VjU5TqbTKF4Ib6PjQySk6KxihkdRPF3UF92hD0ICrXB0ARXBkGQRhFXVBUdSVEUEVlYdRz6BIJzvBACwAxY3CmVgC2tOpP2+Ilf0pdQ1CUQtATAvYyAPaCMHgxDkJRVCES1bBmyREVsJHK88Nxa4JDNYsSmfGRfjcexSRcT9C1YYlvj0VgFHsDZqjYysACcwAARzBOABEgeDITARDcCuWtjwDIUwAAMxDCMRUDCUlSHSg0WlaUpQk7EbxklJqnkDRfjKAwKOKE0s3KR9GLSZ8NmyHRjNaMzLOs2zYPwBzoSuS8Ivw29ZIQGLSDi9lEutBkrE-Ox3BsP93Fka0HFYKRct8bYuXAsgfT9ANAwwBDUAALycwZGEDEVhwAIRRBEAGlKF7EUBxwySLmqqLLHuCYctyLMmI+IsNgUQEfg0PL9gm+tpvQWaFoqmUESFLUAHVKEDNElWCgAJQ6quk9MVnOrIpiuz9PnkWx7EXO1Fw5YaQXY2tJqDGa0G+pah2C5sJWwoKwc1FFxNw46YcnADkb-BrPhJAwlC0clseG9AaAYeBYlxytQiOCIUxO2HUusMolk0KxAIMTYcdGvG+UgwUpaZwjM0ZRwlL-T4jCpFQNP09m7AewEFAdZwhsaF0xqrLXDzrE9gzPMMdcNSc7FYR8PC5upyR+LmZA0uLSjePQdCUDYHG5rQXo4t3oPwWCeOQX2CNq39mKfJPfktBQtBojYuspfq9F-DxmNT12BU9biEJz69pf93QNEWKwLRRwsy8jldaKr4C-20FjVadis3XT3OapSTwiVkHQ50MeOlyzZx3nWYs9IBdQZAexuCqs2AbIgOzSsc5yjwJ9yvLPBfTq-QtFkpAs0uUcPzZXcorTdRfJ-Zw08RrOzxmfIqV8SplUWjVcci9EB2yJNSTQ8tMwJ1cH-Ao-V3j0VLFob49swGi1aG9T2RN5rwPQKQDAQ5UCwG4GCGyL90yWh7pkO2gcBqVDisPAopZ3h5geolBiKsnRqwgZWChU0qEkwQZFdhUgNJ1CthsFWc57AaEduA2e+5YGIUgGw5mbNOZEIGoHZiOh2rFh7g9aoAISRWGwY3Dy8jjEd11rVZi1hi4Mn0CSBOnhkYFluoHfQ+kpBslTiYwiABaO4n54mMmZP8LcScHTH1Vj4IAA */
	return createMachine(
		{
			context: { linkState: linkState, errorMessage: undefined as string | undefined },
			tsTypes: {} as import('./linkMachine.typegen').Typegen0,
			schema: {
				events: {} as
					| { type: 'CLAIM'; claim: LinkStateType['claim'] }
					| { type: 'REQUEST CANCELLATION'; cancel: LinkStateType['cancel'] }
					| { type: 'REFUND ISSUED' }
					| {
							type: 'PAYMENT RECEIVED';
							transaction: TransactionDocType;
					  }
					| { type: 'CALL CONNECTED' }
					| { type: 'CALL COMPLETED' }
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
							target: 'unclaimed',
							cond: 'linkUnclaimed'
						},
						{
							target: 'claimed',
							cond: 'linkClaimed'
						},
						{
							target: 'cancelled',
							cond: 'linkCancelled'
						},
						{
							target: 'finalized',
							cond: 'linkFinalized'
						}
					]
				},
				unclaimed: {
					on: {
						CLAIM: {
							target: 'claimed',
							actions: ['claimLink', 'saveLinkState']
						},
						'REQUEST CANCELLATION': {
							target: 'cancelled',
							actions: ['cancelLink', 'saveLinkState']
						}
					}
				},
				claimed: {
					initial: 'waiting4Funding',
					states: {
						waiting4Funding: {
							always: {
								target: 'canCall',
								cond: 'fullyFunded'
							},
							on: {
								'REQUEST CANCELLATION': {
									target: '#linkMachine.requestedCancellation',
									actions: 'cancelLink'
								},
								'PAYMENT RECEIVED': {
									actions: ['receivePayment', 'saveLinkState']
								}
							}
						},
						canCall: {
							on: {
								'CALL CONNECTED': {
									target: 'inCall'
								}
							}
						},
						inCall: {
							on: {
								'CALL COMPLETED': {
									target: '#linkMachine.wating4Finalization'
								}
							}
						}
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
						target: 'cancelled',
						cond: (context) => context.linkState.totalFunding === 0
					}
				},
				wating4Finalization: {
					initial: 'inDispute',
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
							target: '.inDispute',
							actions: 'initiateDispute'
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
				cancelLink: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatuses.CANCELED,
							cancel: event.cancel
						}
					};
				}),

				claimLink: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatuses.CLAIMED,
							claim: event.claim
						}
					};
				}),

				saveLinkState: (context) => {
					if (stateCallback) stateCallback(context.linkState);
				},

				receivePayment: assign((context, event) => {
					if (context.linkState.claim) {
						return {
							linkState: {
								...context.linkState,
								totalFunding: context.linkState.totalFunding + Number(event.transaction.value),
								claim: {
									...context.linkState.claim,
									transactions: context.linkState.claim.transactions
										? [...context.linkState.claim.transactions, event.transaction._id]
										: [event.transaction._id]
								}
							}
						};
					} else {
						return {
							linkState: {
								...context.linkState,
								totalFunding: context.linkState.totalFunding + Number(event.transaction.value)
							}
						};
					}
				}),

				initiateDispute: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatuses.IN_DISPUTE,
							dispute: event.dispute
						}
					};
				})
			},
			guards: {
				linkUnclaimed: (context) => context.linkState.status === LinkStatuses.UNCLAIMED,
				linkCancelled: (context) => context.linkState.status === LinkStatuses.CANCELED,
				linkFinalized: (context) => context.linkState.status === LinkStatuses.FINALIZED,
				linkClaimed: (context) => context.linkState.status === LinkStatuses.CLAIMED,
				fullyFunded: (context) =>
					context.linkState.totalFunding >= context.linkState.requestedFunding
			}
		}
	);
};

export const createLinkMachineService = (
	linkState: LinkStateType,
	saveState?: StateCallBackType
) => {
	const linkMachine = createLinkMachine(linkState, saveState);
	return interpret(linkMachine).start();
};

export type LinkMachineType = ReturnType<typeof createLinkMachine>;
export type LinkMachineStateType = StateFrom<typeof createLinkMachine>;
export type LinkMachineServiceType = ReturnType<typeof createLinkMachineService>;

import type { LinkDocType } from '$lib/ORM/models/link';
import { LinkStatuses } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

type LinkStateType = LinkDocType['state'];

type StateCallBackType = (state: LinkStateType) => void;

export const createLinkMachine = (linkState: LinkStateType, saveState?: StateCallBackType) => {
	const stateCallback = saveState;

	/** @xstate-layout N4IgpgJg5mDOIC5QBsCWA7A1gWQIYGMALDMAOjSwAJkB7XCSAYgG0AGAXUVAAcbZUALqhrouIAB6IAjAA4ALKQCscgGwyZKgOxSAzAE45c+QBoQAT0QAmA6SmLWezXL2W5OuVKkBfL6Yo4CYnQyf2o6BggWKU4kEF5+IRExSQQpG2U1DW19QxNzaUsZUj0Skt1FPXtLLR8-DACiEnJ6sPomZksYnj5BYVFYlMVLUwtUwxVSFSNlHWqVIblakH88RuDmqlo2yOYdLriexP7QFLSFDPUtXQMjORHEGUti0s1NLUK9LRUllcCmgFd0PhkLhUABbJgAYQAMgBBACS2DY+3ivSSA0QzgUhSklikmh0Gj0OhUenuCFcmlIzhKmhkaSyelY318y3qqyCZEBwNBEMiACUAKIARQAqoKAMoAFUokNhADlIYLoXCpfCAPLy5FiVFHZKYmw4vEEokksn5BA6AnUtSZPE6WTuRas35rMg88GQUgAd1BQnQUDkADFARAMFBGEKxZKZXLFcrVRqtRwdYc+vqEHp8Uo6Q4NIoVGbzaMpA5FKRWKxqo8ZJVZjJND92X91h6+T6-eHg6Hw4wAAqwgCa2EF8plQqV8IAaoKACLa2K69MY1KsTTkgw6SY6ZRyVzE1iqFl1LAcpptr2+3oB7voMMBlgpxdp9EnRAOp742R0qRyTRVtJ1wtT4t1eVh5E0RR-2sGRFCbU8W3dEFPQgUh8FwdBIVwZBkEYOUVVlTV5UFSEpTnBdugSZc3wQRR1CUVR1E0GC-zccl5HLYknDpVwPGJPR4IaTk0OQ9t0Mw7DcKjcVpVlBUlRVWE1U1CiDio18JEQLMqSgmQ83mQtSWLaRDy3StLAqX8ZCtfNBLPVtRK9DAsJwvDYQIyF1WwPtoUFMj5yfSi0WOTTM2zXT9ILIt2LkTirT-R5DDSfQ7MQ0gACcwAAR3+OABEgLCgTAHDcCODtr0DfkwAAM1DSNBSDUV5VnSgJ0FadyMCtTgozTxHCUD9LB0NdWHsHdyVLQxJk0T4VFkIbHF-VK3Qy7LctgfKIEK-BipBI5HxRF8QtOPcFF-Ub3FrStPjuC1SxcWwpkPNRFAdKQ1GW4TfX9QMgwwbDUAAL1KvpGCDQU5wAIVhSEAGlWpI9qZwCw71OO6RnAmelePUR47ELdjKmpeLa0LFwdE+ppvq7P70AB4H9slSF+XVAB1Sgg3heV4QlAAJTrUZ6ldf0+UhsdydQ8SimKtzcbjEr450TyEqmQZvWn6ZBkRGFnHm+1FMjKC5+E1SUgXUzR3rf3ORjXrSAxXtu0ZrPLNIhmsgkhqxHxWXQGgGHgWJXWE0ItgiC2hZovcNyeGk9EeIbtBcRRvBdZsVu5RyIAjvUVxJBQZrUZi93UOjf3JawpEmewShUNc9yGY82QQlaL1Qq8ftve8oBz6jQtxWO6-4nd-yMCb68mQ8133Sa4LTlvhLbtCMJc5Be40lIjFYWxtFJhtHBJRQNzm0hLH-DQG0sADKYc3knIknD1-RhA6SpW4SRmip8x0GKJjlhLeLJQEvPFWt8UJPwzBUckkEJhcXsKNbQ1hmI3zIJlHKeUCoYR2iVMqHcuxVVqneCBws8RPDxPmQoUwz7VAmvicsUwOKyGUPHNIKDVroI2pgoqOC+5Lg3tIEWA0B7DX-GNI+wFFD0MLvIOwpYnBN2DqrTuGs0AMz6KQDAs5UCwG4P8fKxCaK6CmlfQa5RKhDXYnRYo8UeJJQMGw6m6t-qqK1iFPhz97oTAuHbEosV3DQNULYOszJRoO2qGw8S2DkCQAMf3KKkwGz53evNFQE1Ziu1uE4DwO5SSp2VvZMg1VnFAxic+S2wttDlhTruW0nx5Ey2Jk4SopZG4khQbElIABaVJFpuk+y8EAA */
	return createMachine(
		{
			context: { linkState: linkState, errorMessage: undefined as string | undefined },
			tsTypes: {} as import('./linkMachine.typegen').Typegen0,
			schema: {
				events: {} as
					| { type: 'CLAIM'; claim: LinkStateType['claim'] }
					| { type: 'REQUEST CANCELLATION'; cancel: LinkStateType['cancel'] }
					| {
							type: 'REFUND RECEIVED';
							transaction: TransactionDocType;
					  }
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
									target: '#linkMachine.requestedCancellation'
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
								},
								'REQUEST CANCELLATION': {
									target: '#linkMachine.requestedCancellation'
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
								'REFUND RECEIVED': {
									actions: ['recieveRefund', 'saveLinkState']
								}
							}
						}
					},
					always: {
						target: 'cancelled',
						cond: (context) => context.linkState.totalFunding <= context.linkState.refundedAmount
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
								...context.linkState
							}
						};
					}
				}),
				recieveRefund: assign((context, event) => {
					if (context.linkState.cancel) {
						return {
							linkState: {
								...context.linkState,
								totalFunding: context.linkState.totalFunding - Number(event.transaction.value),
								cancel: {
									...context.linkState.cancel,
									transactions: context.linkState.cancel.transactions
										? [...context.linkState.cancel.transactions, event.transaction._id]
										: [event.transaction._id]
								}
							}
						};
					} else {
						return {
							linkState: {
								...context.linkState
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

import type { LinkDocType } from '$lib/ORM/models/link';
import { LinkStatus } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import { PUBLIC_MIN_COMPLETED_CALL_DURATION } from '$env/static/public';

const MIN_COMPLETED_CALL = Number(PUBLIC_MIN_COMPLETED_CALL_DURATION || 30000);

type LinkStateType = LinkDocType['linkState'];

type StateCallBackType = (state: LinkStateType) => void;

export const createLinkMachine = (linkState: LinkStateType, saveState?: StateCallBackType) => {
	const stateCallback = saveState;

	/** @xstate-layout N4IgpgJg5mDOIC5QBsCWA7A1gWQIYGMALDMAOjSwAJkB7XCSAYgG0AGAXUVAAcbZUALqhrouIAB6IAjAA4ALKQCscgGwyA7FICcigMzypcgEwAaEAE9ER3a1IqtU1rsUrFLlStkBfL2Yo4CYnQyf2o6BggWKU4kEF5+IRExSQRZBWU1TR19OUNTC0RFVhlSOXV1VX0s1UUfPwwAohJyBrD6JmYjGJ4+QWFRWJSZfMsEB1syiqKZVnVFdQc6kH88JuCWqlp2yOZdbrjexIHQFKkKpVUNbT0DYzNRlVYtUvK5GSkjM89dJZXA5oAruh8MhcKgALZMADCABkAIIASWwbH28T6SUGiDkWgURneRgJ6jUrEURhU90QukcpFYxXUzlmcycJN+DVWQTIQJBYMhkQASgBRACKAFUBQBlAAqlChcIAclCBTD4ZKEQB5OUosRoo7JLE40h4j6E4mk8kFVLyGlyWmsXLGG1aLSsrDs5rciGQUgAdzBQnQUDkADEgRAMFBGILRRLpbKFUqVerNRxtYd+nrUmcKakPCpSOUNKwjBVdHMpCoXY0OaQPbyfX7w8HQ+HGAAFOEATWwArl0sFioRADUBQARLWxHXpzEIYxSfO6ORvHQLZTORTZj6yUpaCqzbTGGTyStu9a1r2+voBpvoMMBlgpidpjEnSlF0hnWSKLQqTTDYtyDdnBKFRdGLGQXFYDwpF0Z1fGWNl-lPUFPQgGtcHQKFcGQZBGFlZUZQ1OUBShSVR3HHoEinF8EAJWxS2xBwKlkb9wI3HFFFIZwcUMVgPgXPFj0Qsgz1Q-B0Mw7DI2FMUpRleVFWVOFVQ1ciDko58JCsIw6IqJ0zlyGQWPXC0zkPQ11BkH8ySkQxvzkQS1mE5C6wwCScLwmECOwVsYQFUixwfCj0WOTSEEUQxSkgoxck+SoPDYuQOK4+1eOsA8HOrETSAAJzAABHAE4AESBMOBMBsNwI560vQM+TAAAzUMpKDEU5RHSh+wFIcyMCtTgozIo6KNDxdB-eYnXUDd7HUOxQPeaC5i0QyZAy91nK9XKCqKkr0PwcrQSOe9USfELTikL9DScbTcl0BdFxGaRDBmyZEumQ8LJ+OC-kcmt1tQ31-UDIMMCw1AAC9Kv6RggwFUcACE4ShABpDriK64cAuO9TTsei7tNAu1oLuu4TKdXRSHAnFrGgu0nVWpCeXPSGr2B9BQYhw6JShPk1QAdUoIMETlBFxQACR6rH+unGy8auwnbsXEnRn3OdKZSvi5E++pXSE37Gf+5mgZBtAOahkcRdbEVSMoIWEVVJSJdTbGMyJOctFLRQZhcd2KgA0mFzsM4CTUUsls9nw4PQGgGHgWJvurUItgiJ2peopWrFA99xgXWySQXenOWBP6U91adRoUBY1B-XjBp0bMCRKbRHFu6x1FblavoQn6sovQHr1vKAS6o0KbKMUpHi0Iwlv05RPkA7Fx8eTJVE0PQC71lC0IwrDkCHjSzoe1J3eebRi0n4pHCp9estcne95xmdtE4j4yhxECnAcBKOLVniNYEzudbdz+jlfKhVYDFQgKVPaFUqq90bHVRqN574DXOjSc6Kh7owW0uFDcwxgI12MFSRwMgtbwUAZlYBm0wEQKgftSGGlJz7yxKSTiw0QJjQWDuKaxRZpgSWhoBwt1r7AIBo2Vm7N6HoFIBgEcqBYDcABMVZB05vxzi-FUYsC1NDmmVjoEoyU3jqCcGNDu2sqxrX1vWPu4iTaSOUdRTQ5MfaexJPYeiftlbyA4p4NuecGJPCMMI-W9jQoYI3B8Z42IphvQ0CQ6+u19qQBCacKeJRdLfm0j4nE2YHAlB3L7OYRJtLfnXvVY24MkmPmdtLKopAtBRULHMRczg2J6E4l+G62gcS8QrAA8xwRkmIAALQ6MQDoGkMEnRTOmXTCOQA */
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
					| {
							type: 'CALL CONNECTED';
					  }
					| { type: 'CALL DISCONNECTED' }
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
						},
						{
							target: 'claimed.requestedCancellation',
							cond: 'linkInCancellationRequested'
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
									target: 'requestedCancellation',
									actions: ['requestCancellation', 'saveLinkState']
								},
								'PAYMENT RECEIVED': {
									actions: ['receivePayment', 'saveLinkState']
								}
							}
						},
						canCall: {
							always: { target: 'gracePeriod', cond: 'gracePeriodStarted' },
							on: {
								'CALL CONNECTED': {
									target: 'callStarted',
									actions: ['startCall', 'saveLinkState']
								},
								'REQUEST CANCELLATION': {
									target: 'requestedCancellation',
									actions: ['requestCancellation', 'saveLinkState']
								}
							}
						},
						callStarted: {
							on: {
								'CALL DISCONNECTED': {
									target: 'gracePeriod',
									actions: ['endCall', 'saveLinkState']
								}
							}
						},
						gracePeriod: {
							after: [
								{
									delay: (context) => {
										let timer = 0;
										if (context.linkState.claim && context.linkState.claim.call.startedAt) {
											timer =
												context.linkState.claim.call.startedAt + MIN_COMPLETED_CALL - Date.now();
										}
										return timer > 0 ? timer : 0;
									},
									target: 'wating4Finalization'
								}
							],
							on: {
								'CALL CONNECTED': {
									target: 'callStarted'
								}
							}
						},
						requestedCancellation: {
							initial: 'waiting4Refund',
							states: {
								waiting4Refund: {
									on: {
										'REFUND RECEIVED': {
											actions: ['receiveRefund', 'saveLinkState']
										}
									}
								}
							},
							always: {
								target: '#linkMachine.cancelled',
								actions: ['cancelApproved', 'saveLinkState'],
								cond: (context) =>
									context.linkState.totalFunding <= context.linkState.refundedAmount
							}
						},
						wating4Finalization: {
							initial: 'inDispute',
							states: {
								inDispute: {}
							},
							on: {
								'FEEDBACK RECEIVED': {
									target: '#linkMachine.finalized'
								},
								'ESCROW FINISHED': {
									target: '#linkMachine.finalized'
								},
								'DISPUTE INITIATED': {
									target: '.inDispute',
									actions: 'initiateDispute'
								}
							}
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
							status: LinkStatus.CANCELED,
							cancel: event.cancel
						}
					};
				}),

				claimLink: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatus.CLAIMED,
							claim: event.claim
						}
					};
				}),

				startCall: assign((context) => {
					if (context.linkState.claim && !context.linkState.claim.call.startedAt) {
						return {
							linkState: {
								...context.linkState,
								call: {
									...context.linkState.claim.call,
									startedAt: new Date().getTime()
								}
							}
						};
					} else {
						return {};
					}
				}),

				endCall: assign((context) => {
					if (context.linkState.claim && context.linkState.claim.call.startedAt) {
						return {
							linkState: {
								...context.linkState,
								call: {
									...context.linkState.claim.call,
									endedAt: new Date().getTime()
								}
							}
						};
					} else {
						return {};
					}
				}),

				requestCancellation: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatus.CANCELLATION_REQUESTED,
							cancel: event.cancel
						}
					};
				}),

				cancelApproved: assign((context) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatus.CANCELED
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
						return {};
					}
				}),

				receiveRefund: assign((context, event) => {
					if (context.linkState.cancel) {
						return {
							linkState: {
								...context.linkState,
								refundedAmount: context.linkState.refundedAmount + Number(event.transaction.value),
								cancel: {
									...context.linkState.cancel,
									transactions: context.linkState.cancel.transactions
										? [...context.linkState.cancel.transactions, event.transaction._id]
										: [event.transaction._id]
								}
							}
						};
					} else {
						return {};
					}
				}),

				initiateDispute: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatus.IN_DISPUTE,
							dispute: event.dispute
						}
					};
				})
			},
			guards: {
				linkUnclaimed: (context) => context.linkState.status === LinkStatus.UNCLAIMED,
				linkCancelled: (context) => context.linkState.status === LinkStatus.CANCELED,
				linkFinalized: (context) => context.linkState.status === LinkStatus.FINALIZED,
				linkClaimed: (context) => context.linkState.status === LinkStatus.CLAIMED,
				linkInCancellationRequested: (context) =>
					context.linkState.status === LinkStatus.CANCELLATION_REQUESTED,
				fullyFunded: (context) =>
					context.linkState.totalFunding >= context.linkState.requestedFunding,
				gracePeriodStarted: (context) => {
					return (
						context.linkState.claim !== undefined &&
						context.linkState.claim.call !== undefined &&
						context.linkState.claim.call.startedAt !== undefined &&
						context.linkState.claim.call.endedAt !== undefined
					);
				}
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

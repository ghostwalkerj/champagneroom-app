import type { LinkDocType } from '$lib/ORM/models/link';
import { LinkStatus } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import { PUBLIC_ESCROW_PERIOD, PUBLIC_GRACE_PERIOD } from '$env/static/public';
import type { CallEventDocType } from '$lib/ORM/models/callEvent';

const GRACE_PERIOD = Number(PUBLIC_GRACE_PERIOD || 90000);
const ESCROW_PERIOD = Number(PUBLIC_ESCROW_PERIOD || 3600000);

type LinkStateType = LinkDocType['linkState'];

type StateCallBackType = (state: LinkStateType) => void;

export const createLinkMachine = (linkState: LinkStateType, saveState?: StateCallBackType) => {
	const stateCallback = saveState;

	/** @xstate-layout N4IgpgJg5mDOIC5QBsCWA7A1gWQIYGMALDMAOjSwAJkB7XCSAYgG0AGAXUVAAcbZUALqhrouIAB6IAjAA4ALKQCsAZgCcrAOwbVqxaznblAGhABPRACY5M0quUA2WRuXWpyxTPsBfLyYo4CYnQyf2o6BggWKU4kEF5+IRExSQRZBRV1LR09AzsTcwRFDUVSKTkPOWUXLSkPHz8MAKISckaw+iZmCxiePkFhUViUqQ10tU1tXX1DfMQZC1sNe0V7Ko0LK0U63xB-PGbg1qpaDsjmZR64vsTB0BTFC1mEZSlWVlsZZU+LLblWH-qu0a+yCITaJwiLDkl3i-SSQ2k8iU4yyU1yxjMiAeqlKjjkqy+nzkUm8Oz2gRaAFd0PhkLhUABbJgAYQAMgBBACS2DYMOuA2SiDkqgUFje+LK+NUFhccieygsONYjjS9k0ZQsUkB5IOZGptPpTMiACUAKIARQAqqaAMoAFUozPZADlmabWRy7ZyAPLO3liWE3QUIYWi8V4qUyuRyzEIMVSUj4mTFWrLEUybXAimHA2MyCkADu9KE6CgcgAYtSIBgoIwzVbbQ6na73Z6fX6OAH+fC7tILBonmUNAn7Dp7DIPPJXopM1gQS1c0bC8WaxWqzXGAAFdkATWwpudDrNbs5ADVTQARf2xQMChEIeYaWxFf5SNzLYcD2OvBylCzj-QMlkKRVFnJpQVIRd8yLfpSzXdBq1LFhOxvbtbgkRBlH+UpKh+L57HsaNHEHCxPlIfQ1VYKRFX7BwZzJLNdUguk8wgSDcHQZlcGQZBGCdD1HV9Z1TWZO1L2vXoEjvXtnlWUh3FWKxWDsMpWGTQdPAUAwNH+DRkzcWRlDA+ccxYpd8A4rieLrC1rXtR0XTdD12S9X0JKuKSeww54NlIPDpQIzRPCkQddAWV43hkTQXBeYpjOzMgoLYizOO43j+NZSgL05G1mSEkSxKvFDJLhdCUncBM5Bo+ZVHWUjVHsQdnHsUgZHkawlmHCi5HipikvY1LrIyyhTXPQ9KGPU0z3E4qPNK4NqlIccikUVQSRkVQJ0UQc1RxGi3AVAylgsXqIP6lKrN48RYAEXABDIXAADN7oAJwACigF6CDAC8wDpUwAEpGB1M6zPzC60vc28vPK3z-P-NU9OI2MxW0JbpSsGVWAqLRToXMG2JesAAEdKTge6IC4mk-rpG5l1gstjTAR6qxs8tLWdC8JpEqbzyKvlPLK6R1ieKx3CW4UfmKFRtC1Bi5wS5jDXzInSfJyAqfwGm7oGZCBfm+9RgWdVVnsKxdDUGRB1eJ8zdkN43GsDwTvl8D8eVtiixLMtywwbjUAALx1kRSAwU1YHwF6aALRhy1NS8ACF2WZABpbmTz5qG0ODI3yOHU3zYyK2UZ0va1MIqrU0IjQ8dMj3l29is-bQIO6bDiOo5j7KbU3S0xMoTlnU5L0XJm-Wg3vUiE30EVCNWECRW2lHPneUc2rcN4xWVIzXZMxKCYb1dffQf3W4GUP0HDyPo8Ya7bvu0gntet64Gvgtfv+oGQfd1jD7g4-T7B3QBfK+ncs6CxzlVPOJIHCF0tqLJYCZZAbRkCMNqLgCI+B2OgGgDB4CxG-ocUIEJIBdggfeKqTwHgtQIi4AyVUsL-lrnqGkBMyEGxkg4BQzhKg6X0K8OwxcChWBapUVBwo1SWwxswpWv8YKN0rAhGs7CJ4yTfAscoRQ1CKA6spa245SDDjWh4HQOkHg7waArPqB8IY8RUdJbytQSjRnWMUJGpE2qhVquRUcXwZSKmQaSSxbs66-1VmTG6GsOJax4kA+mjcmYswQvYmGiIaFaEMJqNqvivzCJWDYKwIxarFD+GbIJQIrGg3ruE9WlNona1UXNRpwwrCiwwUtVxo4QKKhkf1L2R9m6Bzie3N+KShapDNqLCcCgJzTjsLKDavSD79P-oMs+IcMAXlQLAbglJ7pjODNYVeekHC1Q2qGdwUydGtUUG+DIa17BxV3orPpOtVknxbkAg5943wxmEaMBMdUqqjkcIqOwSyPbfJkoRRMWxnC6F0aoJ4Iony1CohOZYOjVq9PqTxUhqFyEyQCq1Xhmo1KeBqsi5MpRGEyiwjpDaoFnlMUems-FJVmmIFqu8UYDhlLjlLnpBBYpDGsEYeUdeGxmFQu8gAWkarGWVJQdAqs+DoMVKKsFeCAA */
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
					| { type: 'CALL DISCONNECTED' }
					| { type: 'FEEDBACK RECEIVED' }
					| { type: 'ESCROW FINISHED' }
					| {
							type: 'DISPUTE INITIATED';
							dispute: NonNullable<LinkStateType['dispute']>;
					  }
					| {
							type: 'CALL EVENT RECEIVED';
							callEvent: CallEventDocType;
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
							target: '#linkMachine.claimed.requestedCancellation',
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
							tags: 'connect2VC',
							after: {
								graceDelay: {
									target: '#linkMachine.claimed.wating4Finalization',
									cond: 'gracePeriodStarted',
									actions: [],
									internal: false
								}
							},
							on: {
								'CALL CONNECTED': {
									actions: ['startCall', 'saveLinkState']
								},
								'REQUEST CANCELLATION': {
									target: 'requestedCancellation',
									cond: 'neverCalled',
									actions: ['requestCancellation', 'saveLinkState']
								},
								'CALL DISCONNECTED': {
									actions: ['endCall', 'saveLinkState']
								},
								'CALL EVENT RECEIVED': {
									actions: ['receiveCallEvent', 'saveLinkState']
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
								cond: (context) =>
									context.linkState.totalFunding <= context.linkState.refundedAmount,
								actions: ['cancelApproved', 'saveLinkState']
							}
						},
						wating4Finalization: {
							initial: 'inEscrow',
							states: {
								inEscrow: {
									after: {
										escrowDelay: {
											target: '#linkMachine.finalized',
											actions: [],
											internal: false
										}
									},
									on: {
										'FEEDBACK RECEIVED': {
											target: '#linkMachine.finalized'
										},
										'DISPUTE INITIATED': {
											target: 'inDispute',
											actions: 'initiateDispute'
										}
									}
								},
								inDispute: {}
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
								claim: {
									...context.linkState.claim,
									call: {
										...context.linkState.claim.call,
										startedAt: new Date().getTime()
									}
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
								claim: {
									...context.linkState.claim,
									call: {
										...context.linkState.claim.call,
										endedAt: new Date().getTime()
									}
								}
							}
						};
					} else {
						return {};
					}
				}),

				receiveCallEvent: assign((context, event) => {
					if (context.linkState.claim) {
						return {
							linkState: {
								...context.linkState,
								claim: {
									...context.linkState.claim,
									call: {
										...context.linkState.claim.call,
										callEvents: [
											...(context.linkState.claim.call.callEvents || []),
											event.callEvent._id
										]
									}
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
			delays: {
				graceDelay: (context) => {
					let timer = 0;
					if (context.linkState.claim && context.linkState.claim.call.startedAt) {
						timer = context.linkState.claim.call.startedAt + GRACE_PERIOD - new Date().getTime();
					}
					console.log('Grace Timer: ', timer);
					return timer > 0 ? timer : 0;
				},
				escrowDelay: (context) => {
					let timer = 0;

					if (context.linkState.claim && context.linkState.claim.call.startedAt) {
						const endTime =
							context.linkState.claim.call.endedAt || context.linkState.claim.call.startedAt;
						timer = endTime + ESCROW_PERIOD - new Date().getTime();
					}
					console.log('Escrow Timer: ', timer);
					return timer > 0 ? timer : 0;
				}
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
				neverCalled: (context) => {
					return (
						context.linkState.claim === undefined ||
						context.linkState.claim.call === undefined ||
						context.linkState.claim.call.startedAt === undefined
					);
				},
				gracePeriodStarted: (context) => {
					return (
						context.linkState.claim !== undefined &&
						context.linkState.claim.call !== undefined &&
						context.linkState.claim.call.startedAt !== undefined
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

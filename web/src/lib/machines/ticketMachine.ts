import { PUBLIC_ESCROW_PERIOD, PUBLIC_GRACE_PERIOD } from '$env/static/public';
import type { CallEventDocType } from '$lib/ORM/models/callEvent';
import { LinkStatus } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import type { TicketDocType } from '$lib/ORM/models/ticket';

type createTicketMachine = TicketDocType['ticketState'];

type StateCallBackType = (state: createTicketMachine) => void;

export const createTicketMachine = (ticketState: createTicketMachine, saveState?: StateCallBackType) => {
	const stateCallback = saveState;

	/** @xstate-layout N4IgpgJg5mDOIC5QBsCWA7A1gWQIYGMALDMAOjSwAJkB7XCSAYgG0AGAXUVAAcbZUALqhrouIAB6IAjAA4ALKQCsU1gHYAnIpkA2AMyLVUuQBoQAT0QAmdQt26Vc1brkzLc9TMUBfL6Yo4CYnQyf2o6BggWKU4kEF5+IRExSQQpVQVlNU0dfUMTc0RPVlI3PQ1WRTs5RTkfPwwAohJyBrD6JmZLGJ4+QWFRWJTZDJUNLT0DI1MLVMsZUnVndVZPFxkpKWc6kH88JuCWqlp2yOZdbrjexIHQIfSlUeyJvOnCywWZXTVWFUtddUsUks212gWaoWOERYcgu8T6SUG0nkDyy41yUwKCG0lmKMnWeOU6kWLm0IIaeyCZAAruh8MhcKgALZMADCABkAIIASWwbFhV36yUQ7gUGwMejmFWszleCDkgNIMkWStY8tU2lYqrJWApzRpdIZzMiACUAKIARQAqqaAMoAFUoLI5ADkWaa2Zy7VyAPLOvliOHXIVymykMXq3SSxTS-IzNyqUhyFTrDXaDw6bSk3w7clgg4GpmQUgAdwZQnQUDkADEaRAMFBGGarbaHU7Xe7PT6-RwAwKEbdEIZ3nJ7Kp1dpKhtI7KVIpFInlnY0qqNZYs-UdXmyAWjSWy-Xq7X64wAAocgCa2FNzodZrdXIAaqaACL+2KBwWI1LredGaqKMo0yTbRZUURZSGxLQwKBVRAX0bVGkpUgdyLUs+grQ90DrCsWB7d8+xuCRCnUBM5xqJxdGxJw8VlJwFEsVRVU+P45DkVVdAQ3V83pQsIGQ3B0BZXBkGQUhggANzAAAnFkRGCfABCYJtrXtR0XTdD0OS9X03x6BJPwHVJ0nnSiNSMbRZFUZRdBnZx3ikNMvnKLQ7HUTit2Qnjd3wAShJEsSwEkmS5LABTWQ5D1HV9Z1TRZO0X10y59P7IiEEWXRExHH55WxTM0hnQwMrAyw3HkfQCQ47NQX2bcvKLHzBOE0SMAAcSkggwBPaThEiKtTRfAAhDkWQAaUoO9TUfBK8L0+FCJSbFZTXCylE1YDJk1SqN0Q5oUL4hq-Oa9A2o6rqpJ6xgnUilloti+LXxmpK5uDIxQxqP5tE8KyNnUEDMQchjSEo6Nlg1FcpG8KrcxqzzDXq3ymtIVr2vwTrupoSIrrZShny5G0budGK4um-lkvm6QXHeCypF+tIbE2VQZ0UTUFh+L44KcdVaihzcYb2-jGv85HTvRyJcZtE9LXiyguWdLkvS0knezJsQZjSLRFWsBjQf0ORtHyIYgKBmp5UXIEgXcvm6v2hGheOlG0fOjHGHEWABFwRTSFwAAzRSpIACigB3nzAekzAASkYaqkP5g7EeF1Gzp6xKPxSlJoyW5Z1EysDDEMVhIy2nNeZj62BcOy6Iux00nxvcbYsmp8HtJ56vw2PWSlUeQNjHbQx0Z-6aakBZ3tkAuiTTNyeZ27i4ZtwXkFwlug1iGYAFoAUTT4NVcap5Fp0whnkeZgZ0TYiUqVjLdLufy6aqJl4M1KcTSTLFkgzU1D1pmgTDYz5AmLoWCU9tpcVqrfKSYAACOVI4CKQgEJWkod6TXD3OhSsxowDe1rI2U0VZLTOmfPXe8TcU4EWDDiSw841yuEqCsCcfcbL-TXCZWcdhqZULXNfXaZdIEwLgZARBqMRIe36EvZWrdDKwSWjUYeqoxzyEMBZew3CDgYFNLAfAUkaDFkYH1Qaw0xoTSms3CRK9DLFQggxIE8oAL4ljFYGQsEwyaGqI4RYa4-iqLIOozR2jdHi0ltLWW8suSK1MfhFWX5LFURsVQz6wxM4eAgmBPQqpljuAnN4pG6ANFaJ0S7N2HsyA+z9v7OA+TiwhzDpHaOzRfGVLIVEixm9YluHifYparhih-D+ECRY2UbA+GzOgDGcAxB1IOBCcIkAzFPxSPKTOw91huOqJPCoMhsn6mtnMtOiBKIKD7gYH4ahDBKlYksxURgTYASJBs7J-M0LlkrDWLC9ZdnkwQIxBMeIz42BkKwIkrhaJUNICsDwjgwKsGsDoB5Zc47+QktJWS6B5LwI+cGKyCYRxpHHJOTYlgCqsQgn3MclEIZc2BNPMBsNeJ3ztidROosMVt2UO8LQ+d9ZZzmDIAqGtXAAnKBMPW3NQEeVjrbZALKpGAsTKOPF9gCWyjXrIYeetMxdxKgXMocKIHQNgW7QRAlhEoP6Gg55chMHYKwtK5+48FjuGsCRHlVCB5q3+NoUgY5qhavSHYMcuq6V8INfAoRyDREpVTp8mmY4SifSoV8HQAEnAzjSJ6yMVlso4pxKK4uM9wG8VtQtMCio8QWX+YCjwhLMRrwYsUViJEXA0xcP3VQDzjXINmZEyRz8AJeoYcm-WVl3BLXlMUOc2JKJKiVIxXNkyyDewwMJVAAAvLts1zGpXWMPbW0Yp16BgqO+wSgAIfWnSRLU1KPINP8UW-ZyJWK5CVBfRVf04zyHnI4IEibwVtqvTDDAz5UCwG4FSRSd6vmbw+i4JyNQvgOIQF8SiQMiQMWlJGdQmxvEQbXm+xAa99DZxHHMVVjlMOeGGV4IAA */
	return createMachine(
		{
			context: { ticketState: ticketState, errorMessage: undefined as string | undefined },
			tsTypes: {} as import("./ticketMachine.typegen").Typegen0,
			schema: {
				events: {} as
					| { type: 'CLAIM'; claim: createTicketMachine['claim']; }
					| { type: 'REQUEST CANCELLATION'; cancel: createTicketMachine['cancel']; }
					| {
						type: 'REFUND RECEIVED';
						transaction: TransactionDocType;
					}
					| {
						type: 'PAYMENT RECEIVED';
						transaction: TransactionDocType;
					}
					| { type: 'CALL CONNECTED'; }
					| { type: 'CALL DISCONNECTED'; }
					| {
						type: 'CALL EVENT RECEIVED';
						callEvent: CallEventDocType;
					}
					| {
						type: 'FEEDBACK RECEIVED';
						feedback: NonNullable<createTicketMachine['feedback']>;
					}
					| {
						type: 'DISPUTE INITIATED';
						dispute: NonNullable<createTicketMachine['dispute']>;
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
						},
						{
							target: 'inEscrow',
							cond: 'linkInEscrow'
						},
						{
							target: 'inDispute',
							cond: 'linkInDispute'
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
							initial: 'neverConnected',
							states: {
								neverConnected: {
									always: [
										{
											target: 'inGracePeriod',
											cond: 'inGracePeriod'
										},
										{
											target: 'connected',
											cond: 'callConnected'
										}
									],
									on: {
										'REQUEST CANCELLATION': {
											target: '#linkMachine.claimed.requestedCancellation',
											actions: ['requestCancellation', 'saveLinkState']
										},
										'CALL CONNECTED': {
											target: 'connected',
											actions: ['startCall', 'saveLinkState']
										}
									}
								},
								connected: {
									on: {
										'CALL DISCONNECTED': {
											actions: ['endCall', 'saveLinkState'],
											target: 'inGracePeriod'
										}
									}
								},
								inGracePeriod: {
									tags: 'callerCanInteract',
									after: {
										graceDelay: {
											target: '#linkMachine.inEscrow',
											actions: ['enterEscrow', 'saveLinkState'],
											internal: false
										}
									},
									on: {
										'FEEDBACK RECEIVED': {
											target: '#linkMachine.finalized',
											actions: ['receiveFeedback', 'finalizeLink', 'saveLinkState']
										},
										'CALL CONNECTED': {},
										'CALL DISCONNECTED': { actions: ['endCall', 'saveLinkState'] },

										'DISPUTE INITIATED': {
											target: '#linkMachine.inDispute',
											actions: ['initiateDispute', 'saveLinkState']
										}
									}
								}
							},
							on: {
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
									context.ticketState.totalFunding <= context.ticketState.refundedAmount,
								actions: ['cancelApproved', 'saveLinkState']
							}
						}
					}
				},
				cancelled: {
					type: 'final'
				},
				finalized: {
					type: 'final'
				},
				inEscrow: {
					tags: 'callerCanInteract',
					after: {
						escrowDelay: {
							target: '#linkMachine.finalized',
							actions: ['exitEscrow', 'finalizeLink', 'saveLinkState'],
							internal: false
						}
					},
					on: {
						'FEEDBACK RECEIVED': {
							target: 'finalized',
							actions: ['receiveFeedback', 'exitEscrow', 'finalizeLink', 'saveLinkState']
						},
						'DISPUTE INITIATED': {
							target: 'inDispute',
							actions: ['initiateDispute', 'saveLinkState']
						}
					}
				},
				inDispute: {}
			}
		},
		{
			actions: {
				cancelLink: assign((context, event) => {
					return {
						ticketState: {
							...context.ticketState,
							updatedAt: new Date().getTime(),
							status: LinkStatus.CANCELED,
							cancel: event.cancel
						}
					};
				}),

				claimLink: assign((context, event) => {
					return {
						ticketState: {
							...context.ticketState,
							updatedAt: new Date().getTime(),
							status: LinkStatus.CLAIMED,
							claim: event.claim
						}
					};
				}),

				startCall: assign((context) => {
					if (context.ticketState.claim) {
						const call = {
							...context.ticketState.claim.call,
							startedAt: Date.now()
						};
						return {
							ticketState: {
								...context.ticketState,
								updatedAt: new Date().getTime(),
								claim: {
									...context.ticketState.claim,
									call: call
								}
							}
						};
					}
					return {};
				}),

				endCall: assign((context) => {
					if (
						context.ticketState.claim &&
						context.ticketState.claim.call &&
						context.ticketState.claim.call.startedAt
					) {
						return {
							ticketState: {
								...context.ticketState,
								updatedAt: new Date().getTime(),
								claim: {
									...context.ticketState.claim,
									call: {
										...context.ticketState.claim.call,
										endedAt: new Date().getTime()
									}
								}
							}
						};
					}
					return {};
				}),

				receiveCallEvent: assign((context, event) => {
					if (context.ticketState.claim) {
						const call = context.ticketState.claim.call || {};
						return {
							ticketState: {
								...context.ticketState,
								updatedAt: new Date().getTime(),
								claim: {
									...context.ticketState.claim,
									call: {
										...call,
										callEvents: [...(call.callEvents || []), event.callEvent._id]
									}
								}
							}
						};
					}
					return {};
				}),

				requestCancellation: assign((context, event) => {
					return {
						ticketState: {
							...context.ticketState,
							updatedAt: new Date().getTime(),
							status: LinkStatus.CANCELLATION_REQUESTED,
							cancel: event.cancel
						}
					};
				}),

				cancelApproved: assign((context) => {
					return {
						ticketState: {
							...context.ticketState,
							updatedAt: new Date().getTime(),
							status: LinkStatus.CANCELED
						}
					};
				}),

				saveLinkState: (context) => {
					if (stateCallback) stateCallback(context.ticketState);
				},

				receivePayment: assign((context, event) => {
					if (context.ticketState.claim) {
						return {
							ticketState: {
								...context.ticketState,
								updatedAt: new Date().getTime(),
								totalFunding: context.ticketState.totalFunding + Number(event.transaction.value),
								claim: {
									...context.ticketState.claim,
									transactions: context.ticketState.claim.transactions
										? [...context.ticketState.claim.transactions, event.transaction._id]
										: [event.transaction._id]
								}
							}
						};
					}
					return {};
				}),

				receiveRefund: assign((context, event) => {
					if (context.ticketState.cancel) {
						return {
							ticketState: {
								...context.ticketState,
								updatedAt: new Date().getTime(),
								refundedAmount: context.ticketState.refundedAmount + Number(event.transaction.value),
								cancel: {
									...context.ticketState.cancel,
									transactions: context.ticketState.cancel.transactions
										? [...context.ticketState.cancel.transactions, event.transaction._id]
										: [event.transaction._id]
								}
							}
						};
					}
					return {};
				}),

				receiveFeedback: assign((context, event) => {
					return {
						ticketState: {
							...context.ticketState,
							updatedAt: new Date().getTime(),
							feedback: event.feedback
						}
					};
				}),

				initiateDispute: assign((context, event) => {
					return {
						ticketState: {
							...context.ticketState,
							updatedAt: new Date().getTime(),
							status: LinkStatus.IN_DISPUTE,
							dispute: event.dispute
						}
					};
				}),

				enterEscrow: assign((context) => {
					if (context.ticketState.status !== LinkStatus.IN_ESCROW) {
						const escrow = {
							startedAt: new Date().getTime()
						} as NonNullable<createTicketMachine['escrow']>;
						return {
							ticketState: {
								...context.ticketState,
								updatedAt: new Date().getTime(),
								status: LinkStatus.IN_ESCROW,
								escrow: escrow
							}
						};
					}
					return {};
				}),

				exitEscrow: assign((context) => {
					if (context.ticketState.status === LinkStatus.IN_ESCROW && context.ticketState.escrow) {
						return {
							ticketState: {
								...context.ticketState,
								updatedAt: new Date().getTime(),
								escrow: {
									...context.ticketState.escrow,
									endedAt: new Date().getTime()
								}
							}
						};
					}
					return {};
				}),

				finalizeLink: assign((context) => {
					const finalized = {
						endedAt: new Date().getTime()
					} as NonNullable<createTicketMachine['finalized']>;
					if (context.ticketState.status !== LinkStatus.FINALIZED) {
						return {
							ticketState: {
								...context.ticketState,
								updatedAt: new Date().getTime(),
								finalized: finalized,
								status: LinkStatus.FINALIZED
							}
						};
					}
					return {};
				})
			},

			delays: {
				graceDelay: (context) => {
					let timer = 0;
					if (
						context.ticketState.claim &&
						context.ticketState.claim.call &&
						context.ticketState.claim.call.startedAt
					) {
						timer = graceTimer(context.ticketState.claim.call.startedAt);
					}
					console.log('graceDelay', timer);
					return timer > 0 ? timer : 0;
				},
				escrowDelay: (context) => {
					let timer = 0;

					if (
						context.ticketState.claim &&
						context.ticketState.claim.call &&
						context.ticketState.claim.call.startedAt
					) {
						const endTime =
							context.ticketState.claim.call.endedAt || context.ticketState.claim.call.startedAt;
						timer = escrowTimer(endTime);
					}
					return timer > 0 ? timer : 0;
				}
			},
			guards: {
				linkUnclaimed: (context) => context.ticketState.status === LinkStatus.UNCLAIMED,
				linkCancelled: (context) => context.ticketState.status === LinkStatus.CANCELED,
				linkFinalized: (context) => context.ticketState.status === LinkStatus.FINALIZED,
				linkInDispute: (context) => context.ticketState.status === LinkStatus.IN_DISPUTE,
				linkInEscrow: (context) => context.ticketState.status === LinkStatus.IN_ESCROW,
				linkClaimed: (context) => context.ticketState.status === LinkStatus.CLAIMED,
				linkInCancellationRequested: (context) =>
					context.ticketState.status === LinkStatus.CANCELLATION_REQUESTED,
				fullyFunded: (context) =>
					context.ticketState.totalFunding >= context.ticketState.requestedAmount,
				callConnected: (context) => {
					return (
						context.ticketState.status === LinkStatus.CLAIMED &&
						context.ticketState.claim !== undefined &&
						context.ticketState.claim.call !== undefined &&
						context.ticketState.claim.call.startedAt !== undefined
					);
				},
				inGracePeriod: (context) => {
					return (
						context.ticketState.status === LinkStatus.CLAIMED &&
						context.ticketState.claim !== undefined &&
						context.ticketState.claim.call !== undefined &&
						context.ticketState.claim.call.startedAt !== undefined &&
						context.ticketState.claim.call.endedAt !== undefined
					);
				}
			}
		}
	);
};

export const createLinkMachineService = (
	linkState: createTicketMachine,
	saveState?: StateCallBackType
) => {
	const linkMachine = createTicketMachine(linkState, saveState);
	return interpret(linkMachine).start();
};

export type LinkMachineType = ReturnType<typeof createTicketMachine>;
export type LinkMachineStateType = StateFrom<typeof createTicketMachine>;
export type LinkMachineServiceType = ReturnType<typeof createLinkMachineService>;

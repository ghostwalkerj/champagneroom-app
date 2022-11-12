import { PUBLIC_ESCROW_PERIOD, PUBLIC_GRACE_PERIOD } from '$env/static/public';
import type { CallEventDocType } from '$lib/ORM/models/callEvent';
import type { LinkDocType } from '$lib/ORM/models/link';
import { LinkStatus } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

const GRACE_PERIOD = Number(PUBLIC_GRACE_PERIOD || 90000);
const ESCROW_PERIOD = Number(PUBLIC_ESCROW_PERIOD || 3600000);

type LinkStateType = LinkDocType['linkState'];

type StateCallBackType = (state: LinkStateType) => void;

export const createLinkMachine = (linkState: LinkStateType, saveState?: StateCallBackType) => {
	const stateCallback = saveState;

	/** @xstate-layout N4IgpgJg5mDOIC5QBsCWA7A1gWQIYGMALDMAOjSwAJkB7XCSAYgG0AGAXUVAAcbZUALqhrouIAB6IAjAA4ALKQCsAZgCcrGQDYATHMWLWygOxGANCACeiXTNKrlmqatUzWLozJlSAvt-MUcAmJ0MgDqOgYIFilOJBBefiERMUkEWQUVdS1dfUMTcysERSNFUik9GQNtZXLlViNffwxAohJyZvD6JmZtWJ4+QWFRONSpIwy1DR09A2MzS0QZbTsjTX1VTWM5VdZtRpAAvFaQ9qpaLqjmZT74gaTh0FTFbQLEGtZWO3k9ErdFTVUcn2hyCbTC50iLDkNwSg2SI2k8iUk2yMzy80Kz1UZUccmUclkRhcKmBzSOwTIAFd0PhkLhUABbJgAYQAMgBBACS2DYMLuQxSiDkgNI2g+jmUuk2kpkrwQkuxrEc6Uc-yVylJWHJbWptPpTKiACUAKIARQAqsaAMoAFUozPZADlmcbWRybZyAPKO3liWH3QUIYUKMVKqSSuTS7SyhYIMVSUiRmQlZTKLxuD5AvwHMmgk56xmQUgAd3pQnQUDkADFqRAMFBGCaLda7Q7na73V6fRw-fz4Y9pNoMdJtgmAS4lZpxg4ZBrsyDjmQCwaS2X69Xa-XGAAFdkATWwxsddpNLs5ADVjQARX1xf0ChEIJZGOzFNxpuTaZz-OVSQyaMptE0JZFFUKRqmePZ51zRdSGXItS0GCsN3QOsKxYHs7z7B4JDeXYyjxIcTDWbQv2TX9o2UUhWEjKQ1n+HQbE1FoKTgulCwgODcHQZlcGQZBGAdN17W9R1jWZG1r1vfpEgfAd5U2UhlH+YwATo1gpHKX8tAUbYjF0VRxhkdR6mY7V83Yld8G43j+MbM1LVte0nRdN12Q9b1pNuWT+1w+VSNFFRPDkQxFCWTxf1UZ4yg+BwiSHJZVCgpotTzJdLKLayeL4gShNZSgr05K1mVE8TJJvTCZLhHDUmUhNP3sVhQM8Sov1-IwHFIYKOqVYUfGg1LYPgzists3L2WE41L2PShT2NC8pMq7zqsDfEX2A4oiScOjpU0X9NDcUUku0TTFGFL97DMtK2P1TKbJyxhxFgARcAEMhcAAMzegAnAAKKBvoIMArzAOkLAASkYBdWOGrjsv4rz7182qAu0IL5FC8KY0KMUiVIAFo2TXZVjqTQrqGjLOO+sAAEdKTgN6IF4mlQbpe5VyQytDTAD7a3sqtzUdK9ZvE+bLwqvkfJq6R9LlXRlPxgx6g2TRIyHcmYcp0hqbphnIGZ-BWdeoYMMllbH3GZZ6jGXYlnqOpFF-P91pOjrnBVlwsxSli2gwY1YHwb6aGLRgq2Na8ACF2WZABpEWz3FxHsMDS3qKMG3o1xh25aMQ6xTA4VXA0zSvZzQbWL9gOg5DwqrW3c1JMoTlHU5D13MWs2A0faMExowFXAO1xFCcYc41nT5x0lcNSKkZ4Nd99B-cD4PHue173q+sA-rgZfixBsHIehhel+rpOpZTz804zu2esd2Mh0cMpjPO74nDnbN0BoBh4DiI+TnBCIkBezn0fJ+OUzwAKaE2AScMHgDoaXnicXUlNgHm3kg4BQHU5AEklF+JUzg9r30jImNM5RviflWOrAaPsLK3U4ohcslYayoXrKgru8lNLLBmOMeo2DVbqFUE7YCpB072D0BpE6WJEHpToXDMabC5J+VnqUbB+kVDYPAkSYUkVDLUQBKsYKRNyjSJuhxbWtN6bPX1txQ2-FjYiA5owuQ3NeaoQUcjREkCTD6Q+JpEoHUXj33+LYXQ1RVQ9zJtQ8yMizE60sYzA2Rt2HLWSaMXQct8ReMyV+co6dIne2iaYg07jpYIFVomfQPDxiRmFG4OUgIXyz12G4OiugcEmKyrY5AQCsIgPkklAC8g0xDl2MPSM9TkxlDqPnVpGjS5-zIB9DAfFUAAC8elVVSYgQynxpxrCihA0Cgj74+JEZjfQoFKlzgKddSuu8SmBlaXLSoChKhjDGMZYZJiMBXlQLAbglI3oPNAa4fGHg1AUIcJnUe0YzpdWHunDw9gljSOBfJAAtIQwomLqIfDxfi-FDRfDeCAA */
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
					| {
							type: 'CALL EVENT RECEIVED';
							callEvent: CallEventDocType;
					  }
					| {
							type: 'FEEDBACK RECEIVED';
							feedback: NonNullable<LinkStateType['feedback']>;
					  }
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
									target: '#linkMachine.inEscrow',
									cond: 'gracePeriodStarted',
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
								},
								'FEEDBACK RECEIVED': {
									target: '#linkMachine.finalized',
									actions: ['receiveFeedback', 'saveLinkState']
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
						}
					}
				},
				cancelled: {
					type: 'final'
				},
				finalized: {
					entry: ['finalizeLink', 'saveLinkState'],
					type: 'final'
				},
				inEscrow: {
					exit: ['exitEscrow', 'saveLinkState'],
					entry: ['enterEscrow', 'saveLinkState'],
					after: {
						escrowDelay: {
							target: 'finalized',
							internal: false
						}
					},
					on: {
						'FEEDBACK RECEIVED': {
							target: 'finalized',
							actions: ['receiveFeedback', 'saveLinkState']
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
						linkState: {
							...context.linkState,
							updatedAt: new Date().getTime(),
							status: LinkStatus.CANCELED,
							cancel: event.cancel
						}
					};
				}),

				claimLink: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							updatedAt: new Date().getTime(),
							status: LinkStatus.CLAIMED,
							claim: event.claim
						}
					};
				}),

				startCall: assign((context) => {
					if (context.linkState.claim) {
						const call = {
							...context.linkState.claim.call,
							startTime: Date.now()
						};
						return {
							linkState: {
								...context.linkState,
								updatedAt: new Date().getTime(),
								claim: {
									...context.linkState.claim,
									call: call
								}
							}
						};
					}
					return {};
				}),

				endCall: assign((context) => {
					if (
						context.linkState.claim &&
						context.linkState.claim.call &&
						context.linkState.claim.call.startedAt
					) {
						return {
							linkState: {
								...context.linkState,
								updatedAt: new Date().getTime(),
								claim: {
									...context.linkState.claim,
									call: {
										...context.linkState.claim.call,
										endedAt: new Date().getTime()
									}
								}
							}
						};
					}
					return {};
				}),

				receiveCallEvent: assign((context, event) => {
					if (context.linkState.claim) {
						const call = context.linkState.claim.call || {};
						return {
							linkState: {
								...context.linkState,
								updatedAt: new Date().getTime(),
								claim: {
									...context.linkState.claim,
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
						linkState: {
							...context.linkState,
							updatedAt: new Date().getTime(),
							status: LinkStatus.CANCELLATION_REQUESTED,
							cancel: event.cancel
						}
					};
				}),

				cancelApproved: assign((context) => {
					return {
						linkState: {
							...context.linkState,
							updatedAt: new Date().getTime(),

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
								updatedAt: new Date().getTime(),
								totalFunding: context.linkState.totalFunding + Number(event.transaction.value),
								claim: {
									...context.linkState.claim,
									transactions: context.linkState.claim.transactions
										? [...context.linkState.claim.transactions, event.transaction._id]
										: [event.transaction._id]
								}
							}
						};
					}
					return {};
				}),

				receiveRefund: assign((context, event) => {
					if (context.linkState.cancel) {
						return {
							linkState: {
								...context.linkState,
								updatedAt: new Date().getTime(),
								refundedAmount: context.linkState.refundedAmount + Number(event.transaction.value),
								cancel: {
									...context.linkState.cancel,
									transactions: context.linkState.cancel.transactions
										? [...context.linkState.cancel.transactions, event.transaction._id]
										: [event.transaction._id]
								}
							}
						};
					}
					return {};
				}),

				receiveFeedback: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							updatedAt: new Date().getTime(),

							feedback: event.feedback
						}
					};
				}),

				initiateDispute: assign((context, event) => {
					return {
						linkState: {
							...context.linkState,
							status: LinkStatus.IN_DISPUTE,
							dispute: event.dispute
						}
					};
				}),

				enterEscrow: assign((context) => {
					if (context.linkState.status !== LinkStatus.IN_ESCROW) {
						const escrow = {
							startedAt: new Date().getTime()
						} as NonNullable<LinkStateType['escrow']>;
						return {
							linkState: {
								...context.linkState,
								updatedAt: new Date().getTime(),
								status: LinkStatus.IN_ESCROW,
								escrow: escrow
							}
						};
					}
					return {};
				}),

				exitEscrow: assign((context) => {
					if (context.linkState.status === LinkStatus.IN_ESCROW && context.linkState.escrow) {
						return {
							linkState: {
								...context.linkState,
								updatedAt: new Date().getTime(),
								escrow: {
									...context.linkState.escrow,
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
					} as NonNullable<LinkStateType['finalized']>;
					if (context.linkState.status !== LinkStatus.FINALIZED) {
						return {
							linkState: {
								...context.linkState,
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
						context.linkState.claim &&
						context.linkState.claim.call &&
						context.linkState.claim.call.startedAt
					) {
						timer = context.linkState.claim.call.startedAt + GRACE_PERIOD - new Date().getTime();
					}
					return timer > 0 ? timer : 0;
				},
				escrowDelay: (context) => {
					let timer = 0;

					if (
						context.linkState.claim &&
						context.linkState.claim.call &&
						context.linkState.claim.call.startedAt
					) {
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

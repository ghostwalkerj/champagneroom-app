import type { LinkDocType } from '$lib/ORM/models/link';
import { LinkStatus } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';
import { PUBLIC_MIN_COMPLETED_CALL_DURATION } from '$env/static/public';
import type { CallEventDocType } from '$lib/ORM/models/callEvent';

const MIN_COMPLETED_CALL = Number(PUBLIC_MIN_COMPLETED_CALL_DURATION || 90000);

type LinkStateType = LinkDocType['linkState'];

type StateCallBackType = (state: LinkStateType) => void;

export const createLinkMachine = (linkState: LinkStateType, saveState?: StateCallBackType) => {
	const stateCallback = saveState;

	/** @xstate-layout N4IgpgJg5mDOIC5QBsCWA7A1gWQIYGMALDMAOjSwAJkB7XCSAYgG0AGAXUVAAcbZUALqhrouIAB6IAjAA4ALKQCsAZgCcrRQCZNUgOy6pagDQgAnomUA2ZaU2tZU1pdbLlMtwF8PJijgLF0Ml9qOgYIFilOJBBefiERMUkEOwUVdS0dfUNVE3MERV1FUik5RRkpRVYDF0UvHww-IhJyBpD6JmZNKJ4+QWFRaKS9VLUNbT0DYzNEGU1SVV1LRTlnRxKquTqQXzwmwJaqWnbw5mVumN74gdAkrVyLDSLVJctNXU01AxldLZ3-ZuCRzCLDk51ifQSg2kqhG6XGWSmeS0qmKlhKchklXGqk0vwauwCZAAruh8MhcKgALZMADCABkAIIASWwbDBl36iUQchhtlYGhKmjk2iWmnuCGUmhRTikUlUiks7lcirxWAJzRJZIp1PCACUAKIARQAqvqAMoAFUoNIZADkafq6YyLUyAPK2tlicFXLkIHkKOwC4XCzSi8V2KSkFbfKVS0oYyw-bzbfH-fZaqmQUgAdwpQnQUDkADESRAMFBGAaTearTb7Y7nW6PRwvRzITdpHJdOKKjJWKR+e4tGNWKpZKrGoTSBmdTm8+Xi6Xy4wAAoMgCa2H1tqtBodTIAavqACKe6LezlQ-Jj0jKFzKAoyRPKd6KHsVFFvezvXQP0dJ+o1TTMgZyzXM+gLRd0DLAsWBbc822uCQHjmEpJTkSVrAWZQKh7O9I1YD5VExDFJUWCd1XTclMwgadcHQGlcGQZBGBtJ1rXdW19RpC0TzPHo4kvDtklYGR5jsMocRhGQcTFaYEDld5SF0J9WAwhZZkTGQKOA6dqNnfB6MY5jKyNU1LWtO0HSdBkXXdfiLkE9tkIlbRbDSNSnDcT45B7YibBhVR8JWCo1B0vYQP0rNDIYpiWLYulKGPJkzRpTjuN4094IEiEkKGZ55iCyo5FEhVVHlZQe3kIo5WUDDXgKCpE3CqdQNomLjPihl2P1I8d0oPd9UPPjssc3LfVq9z+RKJZCikUM5LyPQ9FIZxRM0TErDUhUWuaNq6NikzxFgARcAEMhcAAM3OgAnAAKKAboIMBjzAclTAASkYP4Ir07VoqMuKHIvZykklOZNA8krrHcBZfPknRZSUOQJl0GFliC3aqP+2ibrAABHIk4HOiBGNJN7ySuOcIMLXUwEu0tTKLY1bWPAbuKGo8svZJy8ukd5wxWXQo2IwKXD7KRmuTH7Wqi3GCaJk7IDJ-AKbO-o4J58ar10YUBwMAox1KKpLEsQX9EKmQrYVYVHBWLHIpxud80LIsMCY1AAC91ZEUgMH1WB8Bumhs0YIt9RPAAhBkaQAaXZ-cueBxDfV1uYqgqNGSkqRYzYRoLIy7X85TsUNMel1Nfv23MXeLd20G9qn-cD4PQ-NGldVdAB1SgiyZW0UoACRGrWfR1vWM8N7OTbzvINrRkXFTeK35sUVQHb+mjnYXN30A9xv+j99AA6DkPGGSs0V2NXjKH7pkXVskfW15ia7gR2YCI28oVPUIUvGTdANAGDwGiDLAErQgSQGftrYSwpxSJmFuUHCKgqj8leFIDemo5bQLHsJKwChfwYTXk+Moa1KryS2spFwiwVg4QMDCDe1d5yQRLNBcsOChIuVlHMUoBQ5D8MknKMoPYpSRifJDKoVtEzL0YXLA6nUOGg2kIoIo-CfxqX4d8NE4ZHBFBfJiFIrxtC4grkBKuci8aE2JsreiqtmI+3QNTWudMGbQUUXzBST5Vr6EsOVHEa81C4QRmtAcRtIZaEUhg0xk49oWIVtY0mti1a4LGikoYQpwz6KUNoKwP4xzyFkU7GuO965ewcUfE+rd3ETRkspGS9C9D6JxDIcM-jbzZBcMRIUKgAIpjMbLIp6sWGlIPr7DAx5UCwG4ESc61SryyDEvYIUJRfy+J0FUcMiwCKkVDAqK2XlClb2KcMveDcHFzOEnbcM0j9bDAxKObClhDk6guS5BUPZUG2CCroKoY5iJPk2NEyiIEknMSgQhF+V4cSWFIPIB86h3BokVG+BGD5hY5xwiVFGezAWARifsS6IzwU5TSYgZ4-ZdZ1WhoUJ85C54FyjIsGUJUtAYVxX0-FYBXlJAALSz0QHygc-JCJvAxgqSWyh-4eCAA */
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
									on: {
										'FEEDBACK RECEIVED': {
											target: '#linkMachine.finalized'
										},
										'ESCROW FINISHED': {
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
						timer =
							context.linkState.claim.call.startedAt + MIN_COMPLETED_CALL - new Date().getTime();
					}
					console.log('Grace Timer: ', timer);
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

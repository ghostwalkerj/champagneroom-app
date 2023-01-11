import { PUBLIC_ESCROW_PERIOD, PUBLIC_GRACE_PERIOD } from '$env/static/public';
import { ShowStatus, type ShowDocType } from '$lib/ORM/models/show';
import type { ShowEventDocType } from '$lib/ORM/models/showEvent';
import type { TicketEventDocType } from '$lib/ORM/models/ticketEvent';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

const GRACE_PERIOD = Number(PUBLIC_GRACE_PERIOD || 90000);
const ESCROW_PERIOD = Number(PUBLIC_ESCROW_PERIOD || 3600000);

type ShowStateType = ShowDocType['showState'];

export type SaveStateCallBackType = (state: ShowStateType) => void;

export const graceTimer = (timerStart: number) => {
	const timer = timerStart + GRACE_PERIOD - new Date().getTime();
	return timer > 0 ? timer : 0;
};

export const escrowTimer = (endTime: number) => {
	const timer = endTime + ESCROW_PERIOD - new Date().getTime();
	return timer > 0 ? timer : 0;
};

export const createShowMachine = (showState: ShowStateType, saveShowStateCallBack?: SaveStateCallBackType) => {

	/** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwAIAbNHCSAYgG0AGAXUVAAc1ZCAF0Jpi3EAA9EAJgAsbMgDYAnNLZsAzAEZp0gOxblWrQBoQATxmKNZPbOka2ejQFZlitXoC+Xs5Wz4RKQU6Bi09IwQrFpcSCB8AsKi4lIIcgoqapo6+obGZpYILtZkGrJljnp2ABwailo+fqG4BCTk-uEMzCzSsbz8QiJicanpSqrq2roGRqYWiBoOZGz21Spsinq6td6+IP4tQe2hnZGsGn3xA0nDoKPy41lTubMFiNWyZMWKHkZ6TtJ6tJGvtmoE2iFqHQulEWLJLglBskRjIHplJjkZvl5ghZPZxtpZMpVFpNNItIoQQdwcEOtCziwXAjrkMUqiMhNstM8nNCmpPnitHZii41FpHNUqWDWrSTvTuopmYlWSi0mjOc8sbzEFpZC4yLrjLVlHj5C4XFLMIcISQAKKwPAAJ0wTAksEEOEE5BwADMvY6ABRwJ2YAAiYBoOHMAEomNSZeQ7Q7nRh2EqkbdJIgqloyHJrK4flNNm8EFoXDZjOpFOVqtVpObVD49sQ0Ix4HF40dxIibmyEABaRSlgf64njtjitb1UmyS0BBOQsLyiA9lnIu6Ieyl5R6L5saTVFbODZEjQaefW4J4HDEPARmiQNfKjdZoqyap56Qm6o6f4ORRqlLX8yCJKtSTkXRZF2JorRpcgfRIHAaEIAAvJ84l7FVNwQE1pDIYkZyFfQ623HE1GUA07H0Ow6iJBtL3gsgkxDDBnwzfs3EUA1HGKD9yjYes9FLNR8JrA9SRcAwXFqPVGMXAAjNAJAAeR9RD7xUngwEzLDX1SFwPy-H8-wPOogPI+oCPkKppiMIwVnko4yCU1T1MIe8AGE6FgDD+hfTMDKM3QTP0MzANLYpc0MrRqmUYoTXkawnIhR0wAARwAVzgL0IE8297xoSM+0w9dAsQQzPxCj9TIAizCkWXM5HFc9lDWPQ2rsFLghIUNCFgHhMq9diSpwyrjJqsK6tLXUbFams62sXcZN2HwgA */
	return createMachine(
		{
			context: { showState: showState, errorMessage: undefined as string | undefined },
			tsTypes: {} as import("./showMachine.typegen").Typegen0,
			schema: {
				events: {} as
					| { type: 'REQUEST CANCELLATION'; }
					| {
						type: 'REFUND RECEIVED';
						transaction: TransactionDocType;
					} | {
						type: 'Show EVENT RECEIVED';
						showEvent: ShowEventDocType;
					}
					| { type: 'TICKET RESERVED'; }
					| { type: 'TICKET RESERVATION TIMEOUT'; }
					| { type: 'START SHOW'; }
					| { type: 'END SHOW'; }
			},
			predictableActionArguments: true,
			id: 'showMachine',
			initial: 'show loaded',
			states: {
				'show loaded': {
					always: [
						{
							target: 'boxOfficeOpen',
							cond: 'showBoxOfficeOpen'
						},
						{
							target: 'boxOfficeClosed',
							cond: 'showBoxOfficeClosed'
						},
						{
							target: 'requestedCancellation',
							cond: 'showRequestedCancellation'
						},
						{
							target: 'cancelled',
							cond: 'showCancelled'
						},
						{
							target: 'finalized',
							cond: 'showFinalized'
						},
						{
							target: 'inEscrow',
							cond: 'showInEscrow'
						},
						{
							target: 'inDispute',
							cond: 'showInDispute'
						},
						{
							target: 'started',
							cond: 'showStarted'
						},
						{
							target: 'ended',
							cond: 'showEnded'
						}
					]
				},
				cancelled: {
					type: 'final'
				},
				finalized: {
					type: 'final'
				},
				inEscrow: {
				},
				boxOfficeOpen: {
					always: {
						target: 'boxOfficeClosed',
						cond: 'soldOut',
						actions: ['closeBoxOffice', 'saveShowState']
					},
					on: {
						'REQUEST CANCELLATION': {
							target: 'requestedCancellation',
							actions: ['requestCancellation', 'saveShowState']
						},
						'TICKET RESERVED': {
							actions: ['decrementTickets', 'saveShowState']
						},
						'TICKET RESERVATION TIMEOUT': {
							actions: ['incrementTickets', 'saveShowState']
						},
						'START SHOW': {
							target: 'started',
							actions: ['saveShowState']
						}
					}
				},
				boxOfficeClosed: {
					always: {
						target: 'boxOfficeOpen',
						cond: 'notSoldOut',
						actions: ['openBoxOffice', 'saveShowState']
					},
					on: {
						'REQUEST CANCELLATION': {
							target: 'requestedCancellation',
							actions: ['requestCancellation', 'saveShowState']
						},
					}
				},
				started: {
					on: {
						'END SHOW': {
							target: 'ended',
							actions: ['saveShowState']
						}
					}
				},
				ended: {
				},
				requestedCancellation: {
					initial: 'waiting4Refund',
					states: {
						waiting4Refund: {
							on: {
								'REFUND RECEIVED': {
									actions: ['receiveRefund', 'saveShowState'],
								}
							}
						}
					},
					always: {
						target: 'cancelled',
						cond: (context) =>
							context.showState.totalSales <=
							context.showState.refundedAmount,
						actions: ['cancelShow', 'saveShowState']
					}
				},
				inDispute: {}
			}
		},
		{
			actions: {
				closeBoxOffice: assign((context) => {
					return {
						showState: {
							...context.showState,
							updatedAt: new Date().getTime(),
							status: ShowStatus.BOX_OFFICE_CLOSED,
						}
					};
				}),
				openBoxOffice: assign((context) => {
					return {
						showState: {
							...context.showState,
							updatedAt: new Date().getTime(),
							status: ShowStatus.BOX_OFFICE_OPEN,
						}
					};
				}),
				cancelShow: assign((context, _event, meta) => {
					return {
						showState: {
							...context.showState,
							updatedAt: new Date().getTime(),
							status: ShowStatus.CANCELLED,
							cancel: {
								createdAt: new Date().getTime(),
								canceledInState: meta.state ? JSON.stringify(meta.state.value) : 'unknown'
							}
						}
					};
				}),
				requestCancellation: assign((context, _event, meta) => {
					return {
						showState: {
							...context.showState,
							updatedAt: new Date().getTime(),
							status: ShowStatus.CANCELLATION_REQUESTED,
							ticketsAvailable: 0,
							cancel: {
								createdAt: new Date().getTime(),
								canceledInState: meta.state ? JSON.stringify(meta.state.value) : 'unknown'
							}
						}
					};
				}),
				receiveRefund: assign((context, event) => {
					return {
						showState: {
							...context.showState,
							updatedAt: new Date().getTime(),
							refundedAmount: context.showState.refundedAmount + Number(event.transaction.value),
							transactions: [...context.showState.transactions || [], event.transaction._id]
						}
					};
				}),
				saveShowState: (context) => {
					if (saveShowStateCallBack) saveShowStateCallBack(context.showState);
				},
				incrementTickets: assign((context) => {
					return {
						showState: {
							...context.showState,
							updatedAt: new Date().getTime(),
							ticketsAvailable: context.showState.ticketsAvailable + 1,
						}
					};
				}),
				decrementTickets: assign((context) => {
					return {
						showState: {
							...context.showState,
							updatedAt: new Date().getTime(),
							ticketsAvailable: context.showState.ticketsAvailable - 1,
						}
					};
				}),
			},
			guards: {
				showCancelled: (context) => context.showState.status === ShowStatus.CANCELLED,
				showFinalized: (context) => context.showState.status === ShowStatus.FINALIZED,
				showInDispute: (context) => context.showState.status === ShowStatus.IN_DISPUTE,
				showInEscrow: (context) => context.showState.status === ShowStatus.IN_ESCROW,
				showRequestedCancellation: (context) =>
					context.showState.status === ShowStatus.CANCELLATION_REQUESTED,
				showBoxOfficeOpen: (context) => context.showState.status === ShowStatus.BOX_OFFICE_OPEN,
				showBoxOfficeClosed: (context) => context.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
				showStarted: (context) => context.showState.status === ShowStatus.STARTED,
				showEnded: (context) => context.showState.status === ShowStatus.ENDED,
				soldOut: (context) => context.showState.ticketsAvailable === 0,
				notSoldOut: (context) => context.showState.ticketsAvailable > 0,
			}
		}
	);
};

export const createShowMachineService = (
	showState: ShowStateType,
	saveShowStateCallBack?: SaveStateCallBackType,
) => {
	const showMachine = createShowMachine(showState, saveShowStateCallBack);
	return interpret(showMachine).start();
};

export type ShowMachineType = ReturnType<typeof createShowMachine>;
export type ShowMachineStateType = StateFrom<typeof createShowMachine>;
export type ShowMachineServiceType = ReturnType<typeof createShowMachineService>;

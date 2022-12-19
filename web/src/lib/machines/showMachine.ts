import { PUBLIC_ESCROW_PERIOD, PUBLIC_GRACE_PERIOD } from '$env/static/public';
import { type ShowDocType, ShowStatus } from '$lib/ORM/models/show';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

const GRACE_PERIOD = Number(PUBLIC_GRACE_PERIOD || 90000);
const ESCROW_PERIOD = Number(PUBLIC_ESCROW_PERIOD || 3600000);

type ShowStateType = ShowDocType['showState'];

type StateCallBackType = (state: ShowStateType) => void;

export const graceTimer = (timerStart: number) => {
	const timer = timerStart + GRACE_PERIOD - new Date().getTime();
	return timer > 0 ? timer : 0;
};

export const escrowTimer = (endTime: number) => {
	const timer = endTime + ESCROW_PERIOD - new Date().getTime();
	return timer > 0 ? timer : 0;
};

export const createShowMachine = (showState: ShowStateType, saveState?: StateCallBackType) => {
	const stateCallback = saveState;

	/** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwAIAbNHCSAYgG0AGAXUVAAc1ZCAF0Jpi3EAA9EAJgAsbMgDYAnNLZsAzAEZp0gOxblWrQBoQATxmKNZPbOka2ejQFZlitXoC+Xs5Wz4RKQU6Bi09IwQrFpcSCB8AsKi4lIIcgoqapo6+obGZpYILtZkGrJljnp2ABwailo+fqG4BCTk-uEMzCzSsbz8QiJicanpSqrq2roGRqYWiBoOZGz21Spsinq6td6+IP4tQe2hnZGsGn3xA0nDoKPy41lTubMFiNWyZMWKHkZ6TtJ6tJGvtmoE2iFqHQulEWLJLglBskRjIHplJjkZvl5ghZPZxtpZMpVFpNNItIoQQdwcEOtCziwXAjrkMUqiMhNstM8nNCmpPnitHZii41FpHNUqWDWrSTvTuopmYlWSi0mjOc8sbzEFpZC4yLrjLVlHj5C4XFLMIcISQAKKwPAAJ0wTAksEEOEE5BwADMvY6ABRwJ2YAAiYBoOHMAEomNSZeQ7Q7nRh2EqkbdJIgqloyHJrK4flNNm8EFoXDZjOpFOVqtVpObVD49sQ0Ix4HF40dxIibmyEABaRSlgf64njtjitb1UmyS0BBOQsLyiA9lnIu6Ieyl5R6L5saTVFbODZEjQaefW4J4HDEPARmiQNfKjdZoqyap56Qm6o6f4ORRqlLX8yCJKtSTkXRZF2JorRpcgfRIHAaEIAAvJ84l7FVNwQE1pDIYkZyFfQ623HE1GUA07H0Ow6iJBtL3gsgkxDDBnwzfs3EUA1HGKD9yjYes9FLNR8JrA9SRcAwXFqPVGMXAAjNAJAAeR9RD7xUngwEzLDX1SFwPy-H8-wPOogPI+oCPkKppiMIwVnko4yCU1T1MIe8AGE6FgDD+hfTMDKM3QTP0MzANLYpc0MrRqmUYoTXkawnIhR0wAARwAVzgL0IE8297xoSM+0w9dAsQQzPxCj9TIAizCkWXM5HFc9lDWPQ2rsFLghIUNCFgHhMq9diSpwyrjJqsK6tLXUbFams62sXcZN2HwgA */
	return createMachine(
		{
			context: { showState: showState, errorMessage: undefined as string | undefined },
			tsTypes: {} as import("./showMachine.typegen").Typegen0,
			schema: {
				events: {} as
					| { type: 'REQUEST CANCELLATION'; }
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
					on: {
						'REQUEST CANCELLATION': {
							target: 'cancelled',
							actions: ['cancelShow', 'saveShowState']
						}
					}
				},
				boxOfficeClosed: {
					on: {
						'REQUEST CANCELLATION': {
							target: 'requestedCancellation',
							actions: ['requestCancellation', 'saveShowState']
						},
					}
				},
				requestedCancellation: {},
				inDispute: {}
			}
		},
		{
			actions: {
				cancelShow: assign((context, _event, meta) => {
					return {
						showState: {
							...context.showState,
							updatedAt: new Date().getTime(),
							status: ShowStatus.CANCELED,
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
							cancel: {
								createdAt: new Date().getTime(),
								canceledInState: meta.state ? JSON.stringify(meta.state.value) : 'unknown'
							}
						}
					};
				}),
				saveShowState: (context) => {
					if (stateCallback) stateCallback(context.showState);
				},
			},
			guards: {
				showCancelled: (context) => context.showState.status === ShowStatus.CANCELED,
				showFinalized: (context) => context.showState.status === ShowStatus.FINALIZED,
				showInDispute: (context) => context.showState.status === ShowStatus.IN_DISPUTE,
				showInEscrow: (context) => context.showState.status === ShowStatus.IN_ESCROW,
				showRequestedCancellation: (context) =>
					context.showState.status === ShowStatus.CANCELLATION_REQUESTED,
				showBoxOfficeOpen: (context) => context.showState.status === ShowStatus.BOX_OFFICE_OPEN,
				showBoxOfficeClosed: (context) => context.showState.status === ShowStatus.BOX_OFFICE_CLOSED,
			}
		}
	);
};

export const createShowMachineService = (
	showState: ShowStateType,
	saveState?: StateCallBackType
) => {
	const showMachine = createShowMachine(showState, saveState);
	return interpret(showMachine).start();
};

export type ShowMachineType = ReturnType<typeof createShowMachine>;
export type ShowMachineStateType = StateFrom<typeof createShowMachine>;
export type ShowMachineServiceType = ReturnType<typeof createShowMachineService>;

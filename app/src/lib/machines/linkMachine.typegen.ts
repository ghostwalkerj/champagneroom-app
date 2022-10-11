// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
	'@@xstate/typegen': true;
	internalEvents: {
		'': { type: '' };
		'done.invoke.callerCallMachine.loading link:invocation[0]': {
			type: 'done.invoke.callerCallMachine.loading link:invocation[0]';
			data: unknown;
			__tip: 'See the XState TS docs to learn how to strongly type this.';
		};
		'error.platform.callerCallMachine.loading link:invocation[0]': {
			type: 'error.platform.callerCallMachine.loading link:invocation[0]';
			data: unknown;
		};
		'xstate.init': { type: 'xstate.init' };
	};
	invokeSrcNameMap: {
		loadLink: 'done.invoke.callerCallMachine.loading link:invocation[0]';
	};
	missingImplementations: {
		actions: never;
		services: 'loadLink';
		guards: never;
		delays: never;
	};
	eventsCausingActions: {
		assignErrorToContext: 'error.platform.callerCallMachine.loading link:invocation[0]';
		assignLinktoContext: 'done.invoke.callerCallMachine.loading link:invocation[0]';
		cancelCall: 'REQUEST CANCELLATION';
		claimCall: 'CLAIM';
		initiateDispute: 'DISPUTE INITIATED';
		sendTransaction: 'TRANSACTION RECEIVED';
	};
	eventsCausingServices: {
		loadLink: 'xstate.init';
	};
	eventsCausingGuards: {
		fullyFunded: '';
		linkCancelled: '';
		linkClaimed: '';
		linkFinalized: '';
		linkUnclaimed: '';
	};
	eventsCausingDelays: {};
	matchesStates:
		| 'cancelled'
		| 'claimed'
		| 'claimed.canCall'
		| 'claimed.waiting4Funding'
		| 'finalized'
		| 'link loaded'
		| 'loading link'
		| 'loading link error'
		| 'requestedCancellation'
		| 'requestedCancellation.waiting4Refund'
		| 'unclaimed'
		| 'wating4Finalization'
		| 'wating4Finalization.inDispute'
		| {
				claimed?: 'canCall' | 'waiting4Funding';
				requestedCancellation?: 'waiting4Refund';
				wating4Finalization?: 'inDispute';
		  };
	tags: never;
}

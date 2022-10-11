// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
	'@@xstate/typegen': true;
	internalEvents: {
		'': { type: '' };
		'xstate.init': { type: 'xstate.init' };
	};
	invokeSrcNameMap: {};
	missingImplementations: {
		actions: never;
		services: never;
		guards: never;
		delays: never;
	};
	eventsCausingActions: {
		cancelCall: 'REQUEST CANCELLATION';
		claimCall: 'CLAIM';
		initiateDispute: 'DISPUTE INITIATED';
		sendPayment: 'PAYMENT RECEIVED';
	};
	eventsCausingServices: {};
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

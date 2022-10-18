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
		cancelLink: 'REQUEST CANCELLATION';
		claimLink: 'CLAIM';
		initiateDispute: 'DISPUTE INITIATED';
		receivePayment: 'PAYMENT RECEIVED';
		saveLinkState: 'CLAIM' | 'PAYMENT RECEIVED' | 'REQUEST CANCELLATION';
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
		| 'claimed.inCall'
		| 'claimed.waiting4Funding'
		| 'finalized'
		| 'link loaded'
		| 'requestedCancellation'
		| 'requestedCancellation.waiting4Refund'
		| 'unclaimed'
		| 'wating4Finalization'
		| 'wating4Finalization.inDispute'
		| {
				claimed?: 'canCall' | 'inCall' | 'waiting4Funding';
				requestedCancellation?: 'waiting4Refund';
				wating4Finalization?: 'inDispute';
		  };
	tags: never;
}

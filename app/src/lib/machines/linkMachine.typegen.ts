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
		cancelApproved: '';
		cancelLink: 'REQUEST CANCELLATION';
		claimLink: 'CLAIM';
		initiateDispute: 'DISPUTE INITIATED';
		receiveConnectionAttempt: 'CONNECTION ATTEMPT';
		receivePayment: 'PAYMENT RECEIVED';
		receiveRefund: 'REFUND RECEIVED';
		requestCancellation: 'REQUEST CANCELLATION';
		saveLinkState:
			| ''
			| 'CLAIM'
			| 'CONNECTION ATTEMPT'
			| 'PAYMENT RECEIVED'
			| 'REFUND RECEIVED'
			| 'REQUEST CANCELLATION';
	};
	eventsCausingServices: {};
	eventsCausingGuards: {
		fullyFunded: '';
		linkCancelled: '';
		linkClaimed: '';
		linkFinalized: '';
		linkInCancellationRequested: '';
		linkUnclaimed: '';
	};
	eventsCausingDelays: {};
	matchesStates:
		| 'cancelled'
		| 'claimed'
		| 'claimed.canCall'
		| 'claimed.inCall'
		| 'claimed.requestedCancellation'
		| 'claimed.requestedCancellation.waiting4Refund'
		| 'claimed.waiting4Funding'
		| 'claimed.wating4Finalization'
		| 'claimed.wating4Finalization.inDispute'
		| 'finalized'
		| 'link loaded'
		| 'unclaimed'
		| {
				claimed?:
					| 'canCall'
					| 'inCall'
					| 'requestedCancellation'
					| 'waiting4Funding'
					| 'wating4Finalization'
					| { requestedCancellation?: 'waiting4Refund'; wating4Finalization?: 'inDispute' };
		  };
	tags: never;
}

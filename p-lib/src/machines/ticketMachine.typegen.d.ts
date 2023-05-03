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
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    cancelTicket: 'REFUND RECEIVED' | 'REQUEST CANCELLATION' | 'SHOW CANCELLED';
    deactivateTicket:
      | ''
      | 'FEEDBACK RECEIVED'
      | 'REFUND RECEIVED'
      | 'REQUEST CANCELLATION'
      | 'SHOW CANCELLED';
    enterEscrow: 'SHOW ENDED';
    finalizeTicket: 'FEEDBACK RECEIVED';
    initiateDispute: 'DISPUTE INITIATED';
    missShow: 'SHOW ENDED';
    receiveFeedback: 'FEEDBACK RECEIVED';
    receivePayment: 'PAYMENT RECEIVED';
    receiveRefund: 'REFUND RECEIVED';
    redeemTicket: 'JOINED SHOW';
    requestCancellation: 'REQUEST CANCELLATION' | 'SHOW CANCELLED';
    saveTicketState:
      | ''
      | 'DISPUTE INITIATED'
      | 'FEEDBACK RECEIVED'
      | 'JOINED SHOW'
      | 'PAYMENT RECEIVED'
      | 'REFUND RECEIVED'
      | 'REQUEST CANCELLATION'
      | 'SHOW CANCELLED'
      | 'SHOW ENDED';
    sendJoinedShow: 'JOINED SHOW';
    sendLeftShow: 'LEFT SHOW';
    sendTicketCancelled:
      | 'REFUND RECEIVED'
      | 'REQUEST CANCELLATION'
      | 'SHOW CANCELLED';
    sendTicketRefunded: 'REFUND RECEIVED';
    sendTicketSold: 'PAYMENT RECEIVED';
    updateTicketState: 'TICKETSTATE UPDATE';
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    canCancel: 'REQUEST CANCELLATION' | 'SHOW CANCELLED';
    canRequestCancellation: 'REQUEST CANCELLATION';
    canUpdateTicketState: 'TICKETSTATE UPDATE';
    canWatchShow: 'JOINED SHOW';
    fullyPaid: '' | 'PAYMENT RECEIVED';
    fullyRefunded: 'REFUND RECEIVED';
    ticketCancelled: '';
    ticketFinalized: '';
    ticketInCancellationRequested: '';
    ticketInDispute: '';
    ticketInEscrow: '';
    ticketMissedShow: '';
    ticketReedemed: '';
    ticketReserved: '';
  };
  eventsCausingServices: {};
  matchesStates:
    | 'cancelled'
    | 'ended'
    | 'ended.inDispute'
    | 'ended.inEscrow'
    | 'ended.missedShow'
    | 'finalized'
    | 'reedemed'
    | 'reserved'
    | 'reserved.requestedCancellation'
    | 'reserved.requestedCancellation.waiting4Refund'
    | 'reserved.waiting4Payment'
    | 'reserved.waiting4Show'
    | 'ticketLoaded'
    | {
        ended?: 'inDispute' | 'inEscrow' | 'missedShow';
        reserved?:
          | 'requestedCancellation'
          | 'waiting4Payment'
          | 'waiting4Show'
          | { requestedCancellation?: 'waiting4Refund' };
      };
  tags: never;
}

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
    cancelShow: 'REQUEST CANCELLATION' | 'TICKET CANCELLED';
    closeBoxOffice: 'TICKET RESERVED';
    deactivateShow:
      | ''
      | 'REQUEST CANCELLATION'
      | 'SHOW FINALIZED'
      | 'TICKET CANCELLED';
    decrementTicketsAvailable: 'TICKET RESERVED';
    endShow: 'END SHOW';
    finalizeShow: 'SHOW FINALIZED';
    incrementTicketsAvailable:
      | 'TICKET CANCELLED'
      | 'TICKET RESERVATION TIMEOUT';
    openBoxOffice: 'TICKET CANCELLED' | 'TICKET RESERVATION TIMEOUT';
    refundTicket: 'TICKET REFUNDED';
    requestCancellation: 'REQUEST CANCELLATION';
    saveShowState:
      | ''
      | 'CUSTOMER JOINED'
      | 'CUSTOMER LEFT'
      | 'END SHOW'
      | 'REQUEST CANCELLATION'
      | 'SHOW FINALIZED'
      | 'START SHOW'
      | 'TICKET CANCELLED'
      | 'TICKET REFUNDED'
      | 'TICKET RESERVATION TIMEOUT'
      | 'TICKET RESERVED'
      | 'TICKET SOLD';
    sellTicket: 'TICKET SOLD';
    startShow: 'START SHOW';
    updateShowState: 'SHOWSTATE UPDATE';
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    canCancel: 'REQUEST CANCELLATION';
    canStartShow: 'START SHOW';
    canUpdateShowState: 'SHOWSTATE UPDATE';
    fullyRefunded: 'TICKET CANCELLED';
    showBoxOfficeClosed: '';
    showBoxOfficeOpen: '';
    showCancelled: '';
    showEnded: '';
    showFinalized: '';
    showRequestedCancellation: '';
    showStarted: '';
    soldOut: 'TICKET RESERVED';
  };
  eventsCausingServices: {};
  matchesStates:
    | 'boxOfficeClosed'
    | 'boxOfficeOpen'
    | 'cancelled'
    | 'ended'
    | 'finalized'
    | 'requestedCancellation'
    | 'requestedCancellation.waiting2Refund'
    | 'showLoaded'
    | 'started'
    | { requestedCancellation?: 'waiting2Refund' };
  tags: 'canCreateShow';
}

import type { LinkDocument } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { createMachine } from 'xstate';
import { LinkStatuses } from '$lib/ORM/models/link';

type stateType = LinkDocument['state'];

const createLinkMachine = (link: LinkDocument) => {
  return createMachine({
    context: { link, errorMessage: undefined as string | undefined },
    tsTypes: {} as import("./linkMachine.typegen").Typegen0,
    schema: {
      events: {} as
        | { type: 'CLAIM'; claim: NonNullable<stateType['claim']>; }
        | { type: 'REQUEST CANCELLATION'; cancel: stateType['cancel']; }
        | { type: 'REFUND ISSUED'; }
        | {
          type: 'PAYMENT RECEIVED';
          transaction: TransactionDocType;
        }
        | { type: 'CALL CONNECTED'; }
        | { type: 'CALL DISCONNECTED'; }
        | {
          type: 'CALL ACCEPTED'; connection: NonNullable<stateType['connections']>[0];
        }
        | { type: 'FEEDBACK RECEIVED'; }
        | { type: 'ESCROW FINISHED'; }
        | {
          type: 'DISPUTE INITIATED'; dispute: NonNullable<stateType['dispute']>;
        },
    },
    predictableActionArguments: true,
    id: 'linkMachine',
    initial: 'link loaded',
    states: {
      'link loaded': {
        always: [
          {
            cond: 'linkUnclaimed',
            target: 'unclaimed'
          },
          {
            cond: 'linkClaimed',
            target: 'claimed'
          },
          {
            cond: 'linkCancelled',
            target: 'cancelled'
          },
          {
            cond: 'linkFinalized',
            target: 'finalized'
          }
        ]
      },
      unclaimed: {
        on: {
          CLAIM: {
            actions: 'claimCall',
            target: 'claimed'
          }
        }
      },
      claimed: {
        initial: 'waiting4Funding',
        states: {
          waiting4Funding: {
            always: {
              cond: 'fullyFunded',
              target: 'canCall'
            },
            on: {
              'REQUEST CANCELLATION': {
                actions: 'cancelCall',
                target: '#linkMachine.requestedCancellation'
              },
              'PAYMENT RECEIVED': {
                actions: 'sendPayment',
                target: 'waiting4Funding',
                internal: false
              }
            }
          },
          canCall: { // Maybe this should be broken down into another machine
          },
        }
      },
      requestedCancellation: {
        initial: 'waiting4Refund',
        states: {
          waiting4Refund: {
            on: {
              'REFUND ISSUED': {
                target: '#linkMachine.cancelled'
              }
            }
          }
        },
        always: {
          cond: (context) => context.link.state.fundedAmount === 0,
          target: 'cancelled'
        }
      },
      wating4Finalization: {
        states: {
          inDispute: {}
        },
        on: {
          'FEEDBACK RECEIVED': {
            target: 'finalized'
          },
          'ESCROW FINISHED': {
            target: 'finalized'
          },
          'DISPUTE INITIATED': {
            actions: 'initiateDispute',
            target: '.inDispute'
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
  }
    ,
    {
      actions: {
        claimCall: (context, event) => {
          context.link.state.claim = event.claim;
          context.link.state.status = LinkStatuses.CLAIMED;
          context.link.update({
            $set: {
              state: {
                claim: event.claim,
                status: LinkStatuses.CLAIMED
              }
            }
          });
        },

        cancelCall: (context, event) => { //TODO: Need to refund, etc
          context.link.state.status = LinkStatuses.CANCELED;
          context.link.state.cancel = event.cancel;
          context.link.update({
            $set: {
              state: {
                cancel: event.cancel,
                status: LinkStatuses.CANCELED
              }
            }
          });
        },

        sendPayment: (context, event) => {
          context.link.state.claim?.transactions.push(event.transaction._id);
          context.link.state.fundedAmount += Number.parseInt(event.transaction.value);
          const transactions = context.link.state.claim?.transactions.concat(event.transaction._id);
          context.link.update({
            $set: {
              state: {
                claim: { transactions }
              }
            },
            $inc: {
              state: {
                fundedAmount: Number.parseInt(event.transaction.value)
              }
            }
          });
        },

        initiateDispute: (context, event) => {
          context.link.state.dispute = event.dispute;
          context.link.update({
            $set: {
              state: {
                dispute: event.dispute
              }
            }
          });
        }
      },
      guards: {
        linkUnclaimed: (context) => context.link.state.status === LinkStatuses.UNCLAIMED,
        linkClaimed: (context) => context.link.state.status === LinkStatuses.CLAIMED,
        linkCancelled: (context) => context.link.state.status === LinkStatuses.CANCELED,
        linkFinalized: (context) => context.link.state.status === LinkStatuses.FINALIZED,
        fullyFunded: (context) => context.link.state.fundedAmount >= context.link.requestedAmount,
      }
    });
};

export type LinkMachineType = ReturnType<typeof createLinkMachine>;

export default createLinkMachine;
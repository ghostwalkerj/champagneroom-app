import type { LinkDocType } from '$lib/ORM/models/link';
import type { TransactionDocType } from '$lib/ORM/models/transaction';
import { createMachine } from 'xstate';
import { LinkStatuses } from '$lib/ORM/models/link';

const createLinkMachine = (link: LinkDocType) => {

  const linkMachine =
    createMachine({
      context: { link, errorMessage: undefined as string | undefined },
      tsTypes: {} as import("./linkMachine.typegen").Typegen0,
      schema: {
        events: {} as
          | { type: 'CLAIM'; claim: NonNullable<typeof link.state.claim>; }
          | { type: 'REQUEST CANCELLATION'; cancel: typeof link.state.cancel; }
          | { type: 'REFUND ISSUED'; }
          | {
            type: 'PAYMENT RECEIVED';
            transaction: TransactionDocType;
          }
          | { type: 'CALL CONNECTED'; }
          | { type: 'CALL DISCONNECTED'; }
          | {
            type: 'CALL ACCEPTED'; connection: NonNullable<typeof link.state.connections>[0];
          }
          | { type: 'FEEDBACK RECEIVED'; }
          | { type: 'ESCROW FINISHED'; }
          | { type: 'DISPUTE INITIATED'; dispute: NonNullable<typeof link.state.dispute>; },

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
            cond: (context) => context.link.fundedAmount === 0,
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
    },
      {
        actions: {
          claimCall: (context, event) => {
            context.link.state.claim = event.claim;
            context.link.state.status = LinkStatuses.CLAIMED;
          },
          cancelCall: (context, event) => {
            context.link.state.status = LinkStatuses.CANCELED;
            context.link.state.cancel = event.cancel;
          },
          sendPayment: (context, event) => {
            context.link.state.claim?.transactions.push(event.transaction._id);
            context.link.fundedAmount += Number.parseInt(event.transaction.value);
          },
          initiateDispute: (context, event) => context.link.state.dispute = event.dispute,
        },
        guards: {
          linkUnclaimed: (context) => context.link.state.status === LinkStatuses.UNCLAIMED,
          linkClaimed: (context) => context.link.state.status === LinkStatuses.CLAIMED,
          linkCancelled: (context) => context.link.state.status === LinkStatuses.CANCELED,
          linkFinalized: (context) => context.link.state.status === LinkStatuses.FINALIZED,
          fullyFunded: (context) => context.link.fundedAmount >= context.link.requestedAmount,
        }
      });

  return linkMachine;
};

export type ToggleMachineType = ReturnType<typeof createLinkMachine>;

export default createLinkMachine;
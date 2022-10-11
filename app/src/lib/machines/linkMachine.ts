import type { LinkDocType } from '$lib/ORM/models/link';
import { assign, createMachine } from 'xstate';
import { ConnectionType, LinkStatus, TransactionType, type LinkType } from './LinkType';

const createLinkMachine = (link: LinkDocType) => {

  const linkMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5QGMCGAbdYBOBhD6AsqsgBYCWAdmAHToD2qEVUABOlQNYDEE91NKgDd6nWmkw58mYmSq0GTFuy4Jh9NABdy-ANoAGALqJQAB3qxy2-iZAAPRABYAjI5r6ArAHYAzACYATgAOP0cg-QCvABoQAE9EZyCfGh9wv30vDNCPZw8fAF98mIksPAJZCgFFZko2DkoeHGx6bBpTdFRNADMWgFsaEqlykkqFRhq61XUtHUoDYyQQc0trSlsHBBc3T19AkLCI6LjEAIA2GkdHPLCAn1PnHzvnQuKCIZkR+ToudnHIblsyyss3WiC8QSCKVyD30fi8ARyXlOMXiCCCARoZyCXj8rhxATOnheIEGZQ+cgEAFdKMgOuRev9cAAZACCAElCICLMCbIsNh4-CiTqdks4vB5HKcvC4gokAo5iaTpERPgJaah6ZAaAB3DXaWqOABi1Im3AASgBRACKAFULQBlAAqrFwLIAcrgLUzWY62QB5N1clYgvkJPx+Dw0LxI-SpPyynxInxChCnU6QpPyzwRiP6BVFElvMkqiniOkMiA6vUsI0mljcR1m932lm4X0B1iWz1sgBqFoAIkGeWtQwh0hjnOHHBFEX5TnmUwTIadHHt-C4fPpTn5FUXlRUvurNZXdcCDcbKKah6tQZtVzQPBlwuFY0EBQEU84txOMlL7lcIUuXdJGLA81XLLVsDAJhYkcZVzWtO0nRdd1PW9Fl20DRYgRvUdJwjKMYzjBMk0-CI-AfIIZQeW5QjTYDSn3VUyw1CsaCgmC4IIbhXW9F0AzdC02wHa8Q1ADZowxTdJXRcM8i8ZxF3hGgI18AJnACPwfEcHw8gY94S1GAYIMrKh4N4plWH7Nl7VwAShMdETsO5XDxOFSNnE8hEEUfOENJTcIvCjHxXFcbxpX-fTQOY9iwAAR0pOBNEgfAaTATBOlmKszygRwzTALoTQQw0bTdftWBs+07UHZzg15NyEGcU4zhSCIqM07SV0TFNMgxXxpyCFcAgyNqoqY0tYoSpKUtQNKMtWAFauHW8mpazdgkcDrJR0o5UXFILmvFTxhtlVx81eEDxqM3V9Vyw0qAwcgAC9Mv4bhDQtAcACFWwAaU7ISLV7JyzBcsT7CcVx3G8fxglCcJIhTfwgoRq4RVyEKITG4YJpumt7soR6XoWh1cDNP0AHVWENNk3RsgAJEGljB+qIc2KGdlh-YEd2xA4QxKiPARfRXECDx6ILJUceuzLzwejhidmbhrPtAAFG1HIqunfQwpmcPBiTBWOMdghSOFMn8QIHmjQoC0oegIDgWwpfJIzqmUepOFE1mNlXMjnAuHwzkiEW430IJsddr5Pd+JhIG9kcGvufQVKt+EFJFvNecayIUhFCMrkSU4hZxSPDOj8YPZ+JoWgT297iC3JtwJIXblSbPPJT1cqNSDHQl8Z5Jb3aWvmpI8KzrvCs8xdFm7fbdLkcT9c7ufwJRyQaS53IfLpH8DWK1U9btrS8WEnhrQi7pJw-0W-EkGpIyOGh9oyo62kVCMuwJY49Ys45Vz5s2LinCMApPLhk0riD8xsvym28DmMU6Ru4eC-jFceWozIEEARsL88YVJ5mnPGJI6YFzGzhpRQIjxIh0VcKgia6CIDYISG+Gg+FpwIkQfOJextfCRg-sXB4jwPBCwjjvRie9aBQSmrAZKEBUrIHSh0VY2Vj75UKpeJhjVNpBQ8INY6aQqFBB6nmFSIUtjhUlLQsRBlv6TUSjImac0lHg31j7BIjhfCUXnCI2EhiUz5xUtuARjxdKtzoTLY+BMiavUoIISg-ZyCwFMJSZKmi5zJAlMLBSVEpTiiRpOKEGQETF1uMEcJXw8Zy0JgrGJmiwgplxG4XS6Ig7BAFE8cpapZoKMkIwpark2b3wDutSI04XCaUGj1ApOJ5JXGnJk0RF1xFRwEF0eWz1479INogBeNAG5yWKZ4DwDSQg0CSDMucORinbyWTY5imjEiflEYUIAA */
    createMachine({
      context: { link, errorMessage: undefined as string | undefined },
      tsTypes: {} as import("./linkMachine.typegen").Typegen0,
      schema: {
        events: {} as
          | { type: 'CLAIM'; claim: { name: string; pin: string; date: number; }; }
          | { type: 'REQUEST CANCELLATION'; state: string; }
          | { type: 'REFUND ISSUED'; }
          | {
            type: 'TRANSACTION RECEIVED';
            transaction: {
              from: string;
              to: string;
              amount: number;
              date: number;
              type: TransactionType;
            };
          }
          | { type: 'CALL CONNECTED'; }
          | { type: 'CALL DISCONNECTED'; }
          | { type: 'CALL ACCEPTED'; connection: { caller: string; date: number; type: ConnectionType; }; }
          | { type: 'FEEDBACK RECEIVED'; }
          | { type: 'ESCROW FINISHED'; }
          | { type: 'DISPUTE INITIATED'; },

        services: {} as {
          loadLink: {
            data: LinkType;
          };
        }
      },
      predictableActionArguments: true,
      id: 'callerCallMachine',
      initial: 'loading link',
      states: {
        'loading link': {
          invoke: {
            src: 'loadLink',
            onDone: [
              {
                actions: 'assignLinktoContext',
                target: 'link loaded'
              }
            ],
            onError: [
              {
                actions: 'assignErrorToContext',
                target: 'loading link error'
              }
            ]
          }
        },
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
        'loading link error': {},
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
                  target: '#callerCallMachine.requestedCancellation'
                },
                'TRANSACTION RECEIVED': {
                  actions: 'sendTransaction',
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
                  target: '#callerCallMachine.cancelled'
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
          assignLinktoContext: assign((context, event) => {
            return { link: event.data };
          }),
          assignErrorToContext: assign((context, event) => {
            return { errorMessage: (event.data as Error).message };
          }),
          claimCall: (context, event) => {
            context.link.state.claim = event.claim;
            context.link.state.status = LinkStatus.CLAIMED;
          },
          cancelCall: (context, event) => {
            context.link.state.status = LinkStatus.CANCELED;
            context.link.state.cancel = {
              canceler: context.link.state.claim ? context.link.state.claim.name : 'unknown',
              date: Date.now(),
              refundedAmount: context.link.fundedAmount,
              canceledInStage: event.state,
            };
            context.link.transactions = context.link.transactions.concat({
              from: 'you',
              to: context.link.state.claim ? context.link.state.claim.name : 'unknown',
              amount: context.link.fundedAmount,
              date: Date.now(),
              type: TransactionType.REFUND
            }),
              context.link.fundedAmount = 0;

          },
          sendTransaction: (context, event) => {
            context.link.transactions = context.link.transactions.concat(event.transaction);
            context.link.fundedAmount += event.transaction.amount;
          },
          initiateDispute: (context, event) => context.link.state.status = LinkStatus.IN_DISPUTE,
        },
        guards: {
          linkUnclaimed: (context) => context.link.state.status === LinkStatus.UNCLAIMED,
          linkClaimed: (context) => context.link.state.status === LinkStatus.CLAIMED,
          linkCancelled: (context) => context.link.state.status === LinkStatus.CANCELED,
          linkFinalized: (context) => context.link.state.status === LinkStatus.FINALIZED,
          fullyFunded: (context) => context.link.fundedAmount >= context.link.requestedAmount,
        }
      });

  return linkMachine;
};

export type ToggleMachineType = ReturnType<typeof createLinkMachine>;

export default createLinkMachine;
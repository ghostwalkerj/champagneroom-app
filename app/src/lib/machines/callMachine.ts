import { createMachine } from 'xstate';

export const callMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGAbdBZVyAWAlgHZgB0EBsyA9kScgC6QDEAwgPIBynAoqwCoACAAo8eAJUEBlCQDUJiUAAdqsAgwK1FIAB6IArAHZ9pAJwAWfQGYADAEZzV-aYBs+gBwAaEAE9EdmxtSQwDTW3dDQwAmcyj9FwBfBO80TBx8YjIaOjBGYihhMDAAJykSgDcSti5eARExSXEeADEAVRkAEW0VNQ0tJF1-GydSKKjTOzCowzdzU28-BCibU1JLGzmol0NTQ2HDJJSMbFxCElJs+g0iAqLSiqqObj4hUQlpVtZWHikpbtV1JoiNo9AgAiMxhMpjN9HMFog4oY1nYrKZ3O4XE59FErHFDiBUicMudimBUBAfOZWMdqs86m9JAAZdhSfj-XpAkH+cxzUiooyYmxuKzmQzmeEIFzmIJbdxROzuWFy0xhfGE9JnMik8mU6mYNgAQUZjPqCgGPUB-VAoLsDhcpA2pn0+g2gRRdn0EttG1IUqMhncFlMyyi7jVxw1mVI2opVJprCNJoAkpwOFgUwBxdmW4EDG0BcykIxyuZGXHxT2+RC2ExWSLmdyWCYi6bhtKnKOk5BgAjlfJ69CG42CA1fHjCfg8LrmgF9XPWhFjYJ2FwOMVGFU2MYSzGrRwNxXyuYuRLJAkRjsk3I9vs3AdDk1NNqdbNzrlLJchVeiyw7UxbqIJViQtFWDKYV3-FE2yJTVo2vXt+3jRNBFaTgDU4KQAHUJCnV9OTzRcomXb91z-ACgOiUg5WmQM7GiaIbAOM91UvLV4NvKB7wTYcE1THhGVwmcOStQYPyIr811-TdtyrBBsSCAMpRsCJ4kcNFoMjc5cG7JRrk4pCeJqF5BOUWd8IXOTjDMSxbAcJxXA8CUYVGbFnGUlVJkxDTWNIbSwF0xD9W4k1eKEJ5ajZISc3fIwTAsax7EcZw3C8WSlNGFw5QVJVxlVZiL2JMhiC45COiTKRwuM6dTOE+dRPBExIUmXEYThWTnLiOJ-0DKEvPy9tCtIYgeGKYpqGKWkItNSQZHEeRxDwkSbR5VZ+RmWxhR-CVAzMTKxVFewdlRKJvMGwl8gfEcxwnEyQAtN8CLE4jJI3f8ZMWPa+TRHkFQVfcrFO2DzpuS7UPQrCcOqu6zKWwjnp-V7yNk9FVhxFxdkbOxlhsaxAajYGoEup92lu+7zNEsZxJXF6yPexAwiRbGXXMdGVzmAH+pg-Hjgu4LBF474BKhsnYaeiSEdpwDZLREw2eGFYQnGXEkjPIhqAgOBtBYwaKCoWgrkgRa6tBWJGoseUxW2faPQlJ1RmUjbmbifQFTx85LlyPTChKMpikqYojffdxlK+3EPSMUNAlSxY7eWdxHY2Z3Xc5zS2J1ONMEDx6UWWPkWccRVG2UnkdxFYI3BcGI5mbNw3bY7sELvY4s4s2IJSsBxSEmSJD1lIM6985AdL0gcW9E4C+Q2bY6O2J1MR3WJy42D1Q2mTLTAH4rm6ih6LIxQsjBXP0lUMOsnOcYJq9cRVAisJxN6IEaxoDnfyZtTK7CogvGLlAMImjhEQo1iigxPHIUX5YQDwJmPUEERfS2l2HsE8mVljijSmiZcERK4njROjU8RwBqahgf4ABYIwwqyAA */
  createMachine({
    context: { errorMessage: undefined as string | undefined },
    tsTypes: {} as import('./callMachine.typegen').Typegen0,
    schema: {
      events: {} as
        | { type: 'CONNECT PEER SERVER'; }
        | { type: 'CONNECT PEER REFUSED'; }
        | { type: 'CONNECT PEER LOST'; }
        | { type: 'CONNECT PEER SUCCESS'; }
        | { type: 'DISCONNECTED PEER SERVER'; }
        | { type: 'CALL HANGUP'; }
        | { type: 'CALL OUTGOING'; }
        | { type: 'CALL CONNECTED'; }
        | { type: 'CALL CANCELLED'; }
        | { type: 'CALL REJECTED'; }
        | { type: 'CALL INCOMING'; }
        | { type: 'CALL UNANSWERED'; }
        | { type: 'CALL CANT CONNECT'; }
        | { type: 'CALL DISCONNECTED'; }
        | { type: 'CALL ACCEPTED'; }
    },
    predictableActionArguments: true,
    id: 'callMachine',
    initial: 'disconnected',
    states: {
      disconnected: {
        on: {
          'CONNECT PEER SERVER': {
            target: 'connectingPeerServer'
          }
        }
      },
      connectingPeerServer: {
        on: {
          'CONNECT PEER REFUSED': {
            target: 'inError'
          },
          'CONNECT PEER SUCCESS': {
            target: 'ready4Call'
          }
        }
      },
      ready4Call: {
        on: {
          'CONNECT PEER LOST': {
            target: 'inError'
          },
          'CALL OUTGOING': {
            target: 'calling'
          },
          'CALL INCOMING': {
            target: 'receivingCall'
          }
        }
      },
      receivingCall: {
        on: {
          'CALL ACCEPTED': {
            target: 'acceptingCall'
          },
          'CALL REJECTED': {
            target: 'ready4Call'
          },
          'CALL UNANSWERED': {
            target: 'ready4Call'
          },
          'CALL CANCELLED': {
            target: 'ready4Call'
          }
        }
      },
      acceptingCall: {
        on: {
          'CALL CONNECTED': {
            target: 'inCall'
          },
          'CALL CANT CONNECT': {
            target: 'ready4Call'
          }
        }
      },
      inCall: {
        on: {
          'CALL DISCONNECTED': {
            target: 'ready4Call'
          },
          'CALL HANGUP': {
            target: 'ready4Call'
          }
        }
      },
      inError: {
        on: {
          'CONNECT PEER SERVER': {
            target: 'connectingPeerServer'
          }
        }
      },
      calling: {
        on: {
          'CALL ACCEPTED': {
            target: 'acceptingCall'
          },
          'CALL UNANSWERED': {
            target: 'ready4Call'
          },
          'CALL REJECTED': {
            target: 'ready4Call'
          },
          'CALL CANCELLED': {
            target: 'ready4Call'
          }
        }
      }
    }
  });

export default callMachine;

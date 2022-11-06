import { createMachine } from 'xstate';

export const callMachine =
	/** @xstate-layout N4IgpgJg5mDOIC5QGMCGAbdBZVyAWAlgHZgB0EBsyA9kScgC6QDEAwgPIBynAoqwCoACAAo8eAJUEBlCQDUJAbQAMAXUSgADtVgEGBWupABPRAE4ArKQBMSgBwBmJQDZzSgCxXz5gIy2ANCAAHohOpkqkSqa2tm72pvaetgDspgC+qQFomDj4xGQ0dGCMxFDCYGAATlKVAG6VbFy8AiJikuI8AGIAqjIAIspqSCBaOnoGQyYIFtZ2ji7unj7+QYje3m7epE4x3laxtk5WSUn26ZkY2LiEJKQF9HpEpeVVtfUc3HxCohLSXaysPCkUgGhhGun0REMwQQaw2Wx2e3sByOJwCkzcSRmDmcrg8Xl8ZxAWUuuRuFTAqAgRjcrAuDQ+zW+kgAMuwpPwQUMwWNIRMQvY3KQki5Dm43KZTN57C4AtDvOYnJs1vZHElvElzHFThkiRcctcyOTKdTaZhmEzBL1AfxxOwAJo8fqqUHacHjUDQ7aWHEK5KSqymDFoxAHQWhNxeJR7YVuRWE4n6vKkI1Uml01gAQWZzME7C6-AA4uwAJKcAuczSunlQ1YKpVS1XqzXxYMIcwHIUivbiyXS8zxvVXJMpk3prM50scLCl8vOrlViE1mF10jKxsarWtpJR1cePYWJxKdXeJwD7JDslFMAEGolU3oNjjwQZ-48YT8R0V4YL93GRD2dZV1MY5bHMKwrG2QNTFlf8jyFE8khsdtvCUcwMTPEkDWTK8bzvMds0EdoAClPk-OdK1GRchmhRxNjVJxENQ2wULQpJWwgpwgJAsCINsKCMMTS9kGvW9HnvR8CK6TgM04KQAHUJDIwYKLdXkPVguiEKQ5jUKDP8ECRTZzCSMUUKsP1HFQgSL0NHDRKgcTMwIzNOABbMlJdSjfxouD6MY5DdLY-SrF8LiklA8DIPFazSVs4TcLE-Cc16YspHeJoPydZTvy8tSVgM3ytKYli9PRNxbFICwUPsTVytMFwrBirDcGEjQHgcpLBHS0iss81Sl1CcIauOCDjI1DjWwxLE5lxRYCR1BMbNIFqwDavCzScnMXKEbqBC-bkqPUhBBtIYbEJcY4wKcJxWxPKxSHbcUAIVMCwhVJqk2IRynxStLGh6-afzyuVnE4pRpWYgVbB9W7DgemJ4nlBq3u1c5z1i0gvs6gAJGSCy6YRAdypcUOuiIIalcqYeCgNKsVLxroghIvA+m5iB4CoKmoCp6QylofhkcR5HEIn+r5BAbE4sVwu2OZ6LQmCYT4zZpQxDxoiccr5VZsgAFtUAAa3Wh9NufV93w8+dieoxBESFcDkg1KNTLcVsfE4hJhUPDYlF99wddIfWjcSjanykmT5MU3qrbFo67cQ8zLudjZXf09t7CFBZQIxaqWYWwcMaD42JJzYiAfInLY-y+OHaT7t1lbFxNjsSIWISJRtySAOi5Dk2nxctzmUtlTqxtiXYntxOnfr1PJjVCqIw3LxEaY9IdSIagIDgQxFoxigqFoe5ID60ejrxaxAxCkyGJMjZzFbaYbGxeY8SWAO7iKdqykqaoKjqCoT6HXyqYKwGcUhhD4vTYCFhWwOHtlENwvt3YoT4gHEcaZMCAO8qsdup1Yz7EenYMUjcBSdgVN2CUUoXBoLssbLBwNEAeFbABQU3hgLhR4lFNI+d0bNWQK1dq956FLg8IKRwsY1TChSAqewjcPCdncPKcyRxIIByxpgmOp98qhgevRTWXhyonCCnPcwpghQ9nqqBX2Kp+w8Mwp9IgHMuYAM0UAuU2xNgxCRB3WwRxojhXYs4Ug0sDjP3lm4buhs6GuOwQgJQD8fDmIlJY1w4MaoBy3rABgXMjDHxiQwuJt1W6rlSaYjYpNkg62EWPAAtOVVsdS6ImUQhDaU9htwKjXqkIAA */
	createMachine({
		context: { errorMessage: undefined as string | undefined },
		tsTypes: {} as import('./callMachine.typegen').Typegen0,
		schema: {
			events: {} as
				| { type: 'CONNECT PEER SERVER' }
				| { type: 'CONNECT PEER REFUSED' }
				| { type: 'CONNECT PEER LOST' }
				| { type: 'CONNECT PEER SUCCESS' }
				| { type: 'DISCONNECTED PEER SERVER' }
				| { type: 'CALL HANGUP' }
				| { type: 'CALL OUTGOING' }
				| { type: 'CALL CONNECTED' }
				| { type: 'CALL CANCELLED' }
				| { type: 'CALL REJECTED' }
				| { type: 'CALL INCOMING' }
				| { type: 'CALL UNANSWERED' }
				| { type: 'CALL CANT CONNECT' }
				| { type: 'CALL DISCONNECTED' }
				| { type: 'CALL ACCEPTED' }
				| { type: 'PEER DESTROYED' }
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
					'PEER DESTROYED': {
						target: 'destroyed'
					},
					'CALL OUTGOING': {
						target: 'makingCall'
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
					},
					'CALL DISCONNECTED': {
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
			makingCall: {
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
			},
			destroyed: {
				type: 'final'
			}
		}
	});

export default callMachine;

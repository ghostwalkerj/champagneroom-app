import { createMachine, InterpreterFrom, StateFrom } from 'xstate';

export const callMachine =
	/** @xstate-layout N4IgpgJg5mDOIC5QGMCGAbdBZVyAWAlgHZgB0EBsyA9kScgC6QDEAwgPIBynAoqwCoACAAo8eAJUEBlCQDUJAbQAMAXUSgADtVgEGBWupAAPRADYAjAGZSSywFZzjq3aWmATABYANCACeiAE5rDwB2AA47SyU3NzC3EPMw0wBfZJ80TBx8YjIaOjBGYihhMDAAJylygDdyti5eARExSXEeADEAVRkAEWU1JBAtHT0DAZMEcyUAuxsA6PMQ91ME01MffwQ3JQ9SD1M9uzDF+I8lcxS0kAzsXEISUjz6PSJi0orq2o5uPiFRCWkOqxWDwpFI+oYhrp9ERDONJtNZvNjstzms-IhLI5SCFQgFzqEkkpwhd0hgbtl7o8Cs9XuVKmUamVmH9JN0Qfx2ABNHi9VQQ7RQ0agOFTGZTJFLFZojZuOwBbFhUKWAKmAIxRwhVKkzK3HKkMpgVAQXweVhkurfRoswQAGXYUn44IGkJGMLGiHMdjc8sinhCOI8npiYXWiBCdhmYQCaocYXMQRCbi1VzJWTuZANRpNZswzOagjZDvEXJ5Ts0AtdsI9Xp9lj9AaDsVDCDCRNISTcllMhzjnpVyeuab1meNpvNrAAgjabYJ2B1+ABxdgASU4C7Lgwr0KrE3O5l2WzsHj2QSsARD6ImsTc7YCOKUcuJizsA9TuvuI+z46nM9XHCwq7rnyzpbkKxgeviB7uC4eKmIqbjNl21gJFM0YLK2eLmK+OoUhmBRgAQVRFDm6BsD+ggTkCPDCPwpbAeWwzbu6mz2NibjoXE2yenK0phhY2JRA+QTLN6arYeS6b6vhhHEd+06CK0ABSPx0f0DGCm6wqIJ2MyJhxWyBhGKrNh4ESkPGsqeIqqyti+lyDu+eHIARREvCRZHyR0nATpwUgAOoSKp-KMWB4w6Wx+lcUZvEIJEITmRGpiWFGSjWXG4lDh+0muVA7mTvJk6cMC05BSBIWaeBLG6ex4ScYZPHNoc8qOEcNYhNEiUZY5UnOTJblyTO3TLlIXwNLRvJqZu5U7uFem1QZ3HGZe+z7qliT2Ksd7JWEXW4aQuDORoNJ5eRo0qRNwUaTuFjWLYDhOPYrieM2KXYlMkzuEEX27ZJB1gEdsm5vlM6FUIZ0CBuLpMVpCA3TY9hOM4T3eJexykHYSXKvESiuHWJIpjhknECd8lDSN9TnZDoEVSKCLijVkqoi9io2MeAQeFtQZJT9erEwNggABI+QuHTCFT03MfCYpzAzbgoqszbCTYqW4yEQSYsqPP3MQPBlGU1BMuDvz5jI4jyOI4tXZLNbo3WoQNl6TaXnEpDnlE7VdtMHhbAEWtkAAtqgADWgOkcDFFUTRpXqZWzGzTVYR1YtMVxtYqqYiElje3MSQ7fZb57YHIf9UD5FeT5-mBRdZVWzD8eRfVS0bJMdjxaZKpeok3aOL7+eE3qRehx5M5KZT9FTbXlX1-NUUNZejhTLsXqLO4pmiR4fukIPJdh6dPnFTa0cT7HdesXNicLdFzaOPxhmJ7YkypZqyZENQEBwIYDl7RQVC0E8kCXRPpVDwcpSDQTCJYKI0xFRqkVtYFUixWzem7F2b0m8qSFBeCUOkHwyiAOhpVCI1hDiBjgpnZYUZLBwNdssOC0QO6oOftqCSw5DSjhIvg0KHplRhFIHLdmThE49mbIsW6Xpl5PwDHnZhmUnIuVDpwmmiBvaIUWGA9mqojirFlIqOyMjup-QBjvRRO4QG8NCBjPEHZCR7BEaqbEqJE5HETKlJMfcWHayIBwmuQDxhBB2BGAy9h4hJHMCjDYUZ9zxjiJ4aM540Kbx1nrA2JjJbhCUDYOMexVj4m2M2LYbdIitkTpiHGZjN7b1ymSVJMMMYCS9N7Sy54zjhMQHEXhWdlThkSLKUwD5N7v1gAwfWvgAE+IIXCdJmSwmrAsPsPJl45Zt2Su4eIGM5aQL9jUyqABaGKezlY41sIsFUBln6pCAA */
	createMachine({
		context: { errorMessage: undefined as string | undefined },
		tsTypes: {} as import('./callMachine.typegen').Typegen0,
		schema: {
			events: {} as
				| { type: 'CONNECT PEER SERVER'; }
				| { type: 'CONNECT PEER REFUSED'; }
				| { type: 'CONNECT PEER LOST'; }
				| { type: 'CONNECT PEER SUCCESS'; }
				| { type: 'PEER DESTROYED'; }
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
					},
					'PEER DESTROYED': {
						target: 'destroyed'
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
					'CALL CONNECTED': {
						target: 'inCall'
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
export type CallMachineStateType = StateFrom<typeof callMachine>;
export type CallMachineType = typeof callMachine;
export type CallMachineServiceType = InterpreterFrom<typeof callMachine>;
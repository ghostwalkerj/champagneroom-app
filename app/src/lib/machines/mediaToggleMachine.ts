import { createMachine } from 'xstate';

const createMediaToggleMachine = (mediaTrack: MediaStreamTrack) => {
	const toggleMachine = createMachine(
		{
			context: { mediaTrack },
			predictableActionArguments: true,
			tsTypes: {} as import('./mediaToggleMachine.typegen').Typegen0,
			initial: 'unInitialized',
			schema: {
				events: {} as { type: 'TOGGLE' } | { type: 'TOGGLE ON' } | { type: 'TOGGLE OFF' }
			},
			states: {
				unInitialized: {
					always: [
						{
							cond: 'mediaOn',
							target: 'on'
						},
						{
							cond: 'mediaOff',
							target: 'off'
						}
					]
				},
				on: {
					on: {
						TOGGLE: {
							target: 'off',
							actions: 'turnOff'
						},
						'TOGGLE ON': {
							target: 'on'
						},
						'TOGGLE OFF': {
							target: 'off',
							actions: 'turnOff'
						}
					}
				},
				off: {
					on: {
						TOGGLE: {
							target: 'on',
							actions: 'turnOn'
						},
						'TOGGLE ON': {
							target: 'on',
							actions: 'turnOn'
						},
						'TOGGLE OFF': {
							target: 'off'
						}
					}
				}
			},
			id: 'mediaToggleMachine'
		},
		{
			guards: {
				mediaOn: (context) => {
					return context.mediaTrack.enabled == true;
				},
				mediaOff: (context) => {
					return context.mediaTrack.enabled == false;
				}
			},
			actions: {
				turnOn: (context) => {
					context.mediaTrack.enabled = true;
				},
				turnOff: (context) => {
					context.mediaTrack.enabled = false;
				}
			}
		}
	);

	return toggleMachine;
};

export type MediaToggleMachineType = ReturnType<typeof createMediaToggleMachine>;

export default createMediaToggleMachine;

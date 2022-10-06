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
		turnOff: 'TOGGLE OFF' | 'TOGGLE';
		turnOn: 'TOGGLE ON' | 'TOGGLE';
	};
	eventsCausingServices: {};
	eventsCausingGuards: {
		mediaOff: '';
		mediaOn: '';
	};
	eventsCausingDelays: {};
	matchesStates: 'off' | 'on' | 'unInitialized';
	tags: never;
}

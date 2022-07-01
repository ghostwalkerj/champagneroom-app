import { Peer } from 'peerjs';
import fsm from 'svelte-fsm';
import { readable, writable } from 'svelte/store';
const SIGNAL_SERVER = process.env.VITE_SIGNAL_SERVER || 'http://localhost:8000';
const CALL_TIMEOUT = Number.parseInt(process.env.VITE_CALL_TIMEOUT || '30000');

export const videoCall = (_userId: string, _name: string) => {
	let receiverId: string;
	let callerId: string;
	let cancelCallTimer: NodeJS.Timeout;
	let rejectCallTimer: NodeJS.Timeout;
	let currentCallState = 'uninitialized';
	const userId = _userId;
	const userName = _name;

	const _callerName = writable<string | null>(null);
	const _remoteStream = writable<MediaStream | null>(null);
	const remoteStream = readable<MediaStream | null>(null, (set) => {
		_remoteStream.subscribe((stream) => {
			set(stream);
		});
	});

	const callerName = readable<string | null>(null, (set) => {
		_callerName.subscribe((name) => {
			set(name);
		});
	});

	const callState = fsm('uninitialized', {
		uninitialized: {
			initialized() {
				return 'ready';
			}
		},
		ready: {
			receivingCall() {
				return 'receivingCall';
			},
			makingCall() {
				return 'makingCall';
			}
		},
		makingCall: {
			callConnected() {
				return 'connectedAsCaller';
			},
			callTimeout() {
				return 'ready';
			},
			callRejected() {
				return 'ready';
			},
			cancelCall() {
				return 'ready';
			}
		},
		receivingCall: {
			acceptCall() {
				return 'acceptCall';
			},
			rejectCall() {
				return 'ready';
			},
			callCanceled() {
				return 'ready';
			}
		},
		acceptCall: {
			callConnected() {
				return 'connectedAsReceiver';
			},
			callTimeout() {
				return 'ready';
			}
		},
		connectedAsCaller: {
			callEnded() {
				return 'ready';
			},
			hangUp() {
				return 'ready';
			}
		},
		connectedAsReceiver: {
			callEnded() {
				return 'ready';
			},
			hangUp() {
				return 'ready';
			}
		}
	});

	callState.subscribe((s) => (currentCallState = s));

	// Start new Peerjs workflow
	const peer = new Peer(userId, {
		host: 'localhost',
		port: 8000,
		path: '/'
	});
	let call;

	callState.initialized();

	const resetCallState = () => {
		console.log('reset call state');
		if (call) {
			call.close();
		}
		_callerName.set(null);
		callerId = '';
		receiverId = '';
		_remoteStream.set(null);
		clearTimeout(rejectCallTimer);
		clearTimeout(cancelCallTimer);
	};

	const cancelCall = () => {
		console.log('cancelCall');
		callState.cancelCall();
		resetCallState();
	};

	const makeCall = (_receiverId: string, localStream: MediaStream) => {
		receiverId = _receiverId;
		callState.makingCall();
		cancelCallTimer = setTimeout(() => {
			cancelCall();
		}, CALL_TIMEOUT);

		call = peer.call(receiverId, localStream, { metadata: { name: userName } });
		call.on('stream', (remoteStream) => {
			console.log('Got stream');
			_remoteStream.set(remoteStream);
			callState.callConnected();
		});
	};

	// Receiving calls
	peer.on('call', (_call) => {
		console.log('Received call');
		callState.receivingCall();
		call = _call;
		_callerName.set(call.metadata.name);

		rejectCallTimer = setTimeout(() => {
			rejectCall();
		}, CALL_TIMEOUT);
	});

	const rejectCall = () => {
		clearTimeout(rejectCallTimer);
		callState.rejectCall();
	};

	const acceptCall = (localStream: MediaStream) => {
		callState.acceptCall();
		call.answer(localStream);
		call.on('stream', (remoteStream) => {
			callState.callConnected();
			_remoteStream.set(remoteStream);
		});
	};

	const hangUp = () => {
		if (currentCallState === 'connectedAsReceiver') {
			console.log('Hangup on ', callerId);
		} else if (currentCallState === 'connectedAsCaller') {
			console.log('Hangup on ', receiverId);

			resetCallState();
			callState.hangUp();
		}
	};

	const destroy = () => {
		resetCallState();
	};

	return {
		makeCall,
		acceptCall,
		hangUp,
		rejectCall,
		cancelCall,
		callState,
		remoteStream,
		callerName,
		destroy
	};
};

export type VideoCallType = ReturnType<typeof videoCall>;

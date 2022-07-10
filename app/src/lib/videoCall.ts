import { Peer } from 'peerjs';
import fsm from 'svelte-fsm';
import { readable, writable } from 'svelte/store';

const CALL_TIMEOUT = Number.parseInt(process.env.VITE_CALL_TIMEOUT || '30000');

export const videoCall = (userId?: string) => {
	let receiverId: string;
	let callerId: string;
	let noAnswerTimer: NodeJS.Timeout;
	let rejectCallTimer: NodeJS.Timeout;
	let currentCallState = 'uninitialized';

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

	const _previousState = writable('none');
	const previousState = readable<string | null>(null, (set) => {
		_previousState.subscribe((state) => {
			set(state);
		});
	});

	const callState = fsm('disconnected', {
		disconnected: {
			connected() {
				return 'ready';
			}
		},
		ready: {
			receivingCall() {
				return 'receivingCall';
			},
			makingCall() {
				return 'makingCall';
			},
			disconnected() {
				return 'disconnected';
			}
		},
		makingCall: {
			callConnected() {
				return 'connectedAsCaller';
			},
			callTimeout() {
				_previousState.set('timeout');
				return 'ready';
			},
			callRejected() {
				_previousState.set('receiverRejected');
				return 'ready';
			},
			cancelCall() {
				_previousState.set('callerCanceled');
				return 'ready';
			},
			callEnded() {
				_previousState.set('receiverEnded');
				return 'ready';
			}
		},
		receivingCall: {
			acceptCall() {
				return 'acceptCall';
			},
			rejectCall() {
				_previousState.set('receiverRejected');
				return 'ready';
			},
			callCanceled() {
				_previousState.set('callerCanceled');
				return 'ready';
			},
			callEnded() {
				_previousState.set('callerEnded');
				return 'ready';
			}
		},
		acceptCall: {
			callConnected() {
				return 'connectedAsReceiver';
			},
			callTimeout() {
				_previousState.set('timeout');
				return 'ready';
			}
		},
		connectedAsCaller: {
			callEnded() {
				_previousState.set('receiverEnded');
				return 'ready';
			},
			hangUp() {
				_previousState.set('callerHangup');
				return 'ready';
			}
		},
		connectedAsReceiver: {
			callEnded() {
				_previousState.set('callerEnded');
				return 'ready';
			},
			hangUp() {
				_previousState.set('receiverHangup');
				return 'ready';
			}
		},
		'*': {
			connectionError: () => {
				_previousState.set('error');
				return 'error';
			}
		},
		error: {
			connected() {
				return 'ready';
			}
		}
	});

	callState.subscribe((s) => (currentCallState = s));

	const connect2PeerServer = (userId?: string) => {
		console.log('connect2PeerServer: ', userId);
		return userId ? new Peer(userId, { debug: 3 }) : new Peer({ debug: 3 });
	};

	let peer = connect2PeerServer(userId);
	let mediaConnection;
	let dataConnection;

	const resetCallState = () => {
		console.log('Reset call state');
		if (dataConnection) {
			dataConnection.close();
		}
		if (mediaConnection) {
			mediaConnection.close();
		}
		_callerName.set(null);
		callerId = '';
		receiverId = '';
		_remoteStream.set(null);
		clearTimeout(rejectCallTimer);
		clearTimeout(noAnswerTimer);
		if (!peer.disconnected) {
			callState.connected();
		}
	};

	// Events
	peer.on('open', () => {
		console.log('Connected to peer server');
		callState.connected();
	});

	peer.on('call', (_call) => {
		console.log('Received call');
		callState.receivingCall();
		mediaConnection = _call;
		_callerName.set(mediaConnection.metadata.callerName);

		rejectCallTimer = setTimeout(() => {
			rejectCall();
		}, CALL_TIMEOUT);
	});

	peer.on('error', (err: Error) => {
		console.log('error', err);
		callState.connectionError();

		setTimeout(() => {
			console.log('Attempting to reconnect');
			if (!peer.destroyed) {
				peer.destroy();
			}
			peer = connect2PeerServer(userId);
		}, 5000);
	});

	peer.on('connection', (conn) => {
		dataConnection = conn;
		console.log('Data connection opened');

		dataConnection.on('data', (data) => {
			console.log('Got data', data);
		});

		dataConnection.on('close', () => {
			console.log('Data connection closed');
			callState.callEnded();
			resetCallState();
		});
	});

	peer.on('disconnected', () => {
		console.log('Disconnected from server');
		callState.disconnected();
		setTimeout(() => {
			console.log('Attempting to reconnect');
			if (!peer.destroyed) {
				peer.destroy();
			}
			peer = connect2PeerServer(userId);
		}, 5000);
	});

	const cancelCall = () => {
		console.log('cancelCall');
		callState.cancelCall();
		resetCallState();
	};

	const makeCall = (_receiverId: string, callerName: string, localStream: MediaStream) => {
		receiverId = _receiverId;
		callState.makingCall();
		noAnswerTimer = setTimeout(() => {
			callState.callTimeout();
			resetCallState();
		}, CALL_TIMEOUT);

		mediaConnection = peer.call(receiverId, localStream, { metadata: { callerName } });

		if (mediaConnection) {
			mediaConnection.on('stream', (remoteStream) => {
				_remoteStream.set(remoteStream);
				callState.callConnected();
				clearTimeout(noAnswerTimer);
			});
			mediaConnection.on('close', () => {
				console.log('Call closed');
				callState.callEnded();
				resetCallState();
			});

			dataConnection = peer.connect(receiverId, { metadata: { callerName } });
			dataConnection.on('open', () => {
				console.log('Data connection opened');
			});
			dataConnection.on('close', () => {
				console.log('Data connection closed');
				callState.callEnded();
			});
		} else {
			console.log('Error making call');
			resetCallState();
		}
	};

	const rejectCall = () => {
		clearTimeout(rejectCallTimer);
		callState.rejectCall();
		resetCallState();
	};

	const acceptCall = (localStream: MediaStream) => {
		callState.acceptCall();
		mediaConnection.answer(localStream);
		mediaConnection.on('stream', (remoteStream) => {
			callState.callConnected();
			clearTimeout(rejectCallTimer);

			_remoteStream.set(remoteStream);
		});
		mediaConnection.on('close', () => {
			console.log('Call closed');
			callState.callEnded();
		});
	};

	const hangUp = () => {
		if (currentCallState === 'connectedAsReceiver') {
			console.log('Hangup on ', callerId);
		} else if (currentCallState === 'connectedAsCaller') {
			console.log('Hangup on ', receiverId);
			callState.hangUp();
			resetCallState();
		}
	};

	const destroy = () => {
		console.log('destroy called');
		peer.destroy();
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
		destroy,
		previousState
	};
};

export type VideoCallType = ReturnType<typeof videoCall>;

import Peer from 'simple-peer';
import { io } from 'socket.io-client';
import fsm from 'svelte-fsm';
import { readable, writable } from 'svelte/store';
const SIGNAL_SERVER = process.env.VITE_SIGNAL_SERVER || 'http://localhost:8000';
const CALL_TIMEOUT = Number.parseInt(process.env.VITE_CALL_TIMEOUT || '30000');

export const videoCall = (_userId: string, _name: string) => {
	let receiverId: string;
	let callerId: string;
	let socketId: string;
	let callerSignal: Peer.SignalData | null;
	let peer: Peer.Instance | null;
	let cancelCallTimer: NodeJS.Timeout;
	let rejectCallTimer: NodeJS.Timeout;
	let currentCallState = 'uninitialized';
	const userId = _userId;
	const userName = _name;
	const socket = io(SIGNAL_SERVER, {
		query: {
			userId,
			userName
		}
	});

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
				return 'waitingForSocketId';
			}
		},
		waitingForSocketId: {
			receivedSocketId() {
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
			callAccepted() {
				return 'callAccepted';
			},
			callRejected() {
				return 'ready';
			},
			cancelCall() {
				return 'ready';
			}
		},
		callAccepted: {
			callConnected() {
				return 'connectedAsCaller';
			},
			callTimeout() {
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

	const rejectCall = () => {
		clearTimeout(rejectCallTimer);

		socket.emit('rejectCall', {
			signal: callerSignal,
			callerId: callerId
		});
		callState.rejectCall();
	};

	const resetCallState = () => {
		console.log('reset call state');
		peer ? peer.destroy() : null;
		peer = null;
		_callerName.set(null);
		callerSignal = null;
		callerId = '';
		receiverId = '';
		_remoteStream.set(null);
		clearTimeout(rejectCallTimer);
		clearTimeout(cancelCallTimer);
	};

	// Receiving calls
	if (socket) {
		socket.on('socketId', (id) => {
			socketId = id;
			callState.receivedSocketId();
			console.log('socketId:', socketId);
		});

		socket.on('incomingCall', (data) => {
			_callerName.set(data.callerName);
			callerSignal = data.signal;
			callerId = data.callerId;
			callState.receivingCall();
			rejectCallTimer = setTimeout(() => {
				rejectCall();
			}, CALL_TIMEOUT);
		});

		socket.on('callCanceled', () => {
			console.log('Call canceled');
			resetCallState();
			callState.callCanceled();
		});

		socket.on('callDisconnected', () => {
			console.log('callDisconnected');
			resetCallState();
			callState.callEnded();
		});

		socket.on('disconnect', () => {
			console.log('Disconnected');
			resetCallState();
			callState.callEnded();
		});
	}
	callState.initialized();

	const cancelCall = () => {
		console.log('cancelCall');
		socket.emit('cancelCall', {
			receiverId: receiverId
		});
		callState.cancelCall();
		resetCallState();
	};

	const makeCall = (_receiverId: string, localStream: MediaStream) => {
		receiverId = _receiverId;
		callState.makingCall();
		cancelCallTimer = setTimeout(() => {
			cancelCall();
		}, CALL_TIMEOUT);

		//Set a time then cancel call if no response
		if (socket) {
			peer = new Peer({
				initiator: true,
				trickle: false,
				stream: localStream
			});

			peer.on('signal', (data) => {
				socket.emit('makeCall', {
					receiverId,
					callerName: userName,
					callerId: userId,
					signalData: data
				});
			});

			peer.on('stream', (stream: MediaStream) => {
				console.log('Got stream');
				_remoteStream.set(stream);
				callState.callConnected();
			});

			socket.on('callAccepted', (signal) => {
				if (peer?.writable) {
					peer?.signal(signal); //establish connection
				}
				callState.callAccepted();
				clearTimeout(cancelCallTimer);
			});

			socket.on('callRejected', () => {
				resetCallState();
				callState.callRejected();
			});

			peer.on('close', () => {
				resetCallState();
				callState.callEnded();
			});
		}
	};

	const acceptCall = (localStream: MediaStream) => {
		clearTimeout(rejectCallTimer);

		callState.acceptCall();

		peer = new Peer({
			initiator: false, // receiving call
			trickle: false,
			stream: localStream
		});

		// peer.on('iceStateChange', (connectionState, gatheringState) => {
		// 	console.log('got iceStateChange:', connectionState, gatheringState);
		// });

		if (callerSignal) {
			peer.signal(callerSignal);
		}

		if (socket) {
			peer.on('signal', (data) => {
				// This is data that needs to be passed from peer to peer.
				// Can use other methods, ie. gundb
				socket.emit('acceptCall', {
					signal: data,
					callerId: callerId
				});
			});
		}

		peer.on('stream', (stream: MediaStream) => {
			_remoteStream.set(stream);
			callState.callConnected();
		});

		peer.on('close', () => {
			console.log('peer close');
			socket.off('callAccepted');
			resetCallState();
			callState.callEnded();
		});

		peer.on('error', () => {
			console.log('peer: error');
		});
	};

	const hangUp = () => {
		if (currentCallState === 'connectedAsReceiver') {
			console.log('Hangup on ', callerId);
			if (socket) {
				socket.emit('disconnectCall', { userId: callerId });
			}
		} else if (currentCallState === 'connectedAsCaller') {
			console.log('Hangup on ', receiverId);
			if (socket) {
				socket.emit('disconnectCall', { userId: receiverId });
			}
		}

		if (peer) {
			peer.emit('close');
		}

		resetCallState();
		callState.hangUp();
	};

	const destroy = () => {
		resetCallState();
		socket.close();
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

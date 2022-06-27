import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';
import fsm from 'svelte-fsm';

const SIGNAL_SERVER = process.env.VITE_SIGNAL_SERVER || 'http://localhost:8000';
const CALL_TIMEOUT = Number.parseInt(process.env.VITE_CALL_TIMEOUT || '30000');

export default class VideoStream {
	private _callerName: string;

	get callerName() {
		return this._callerName;
	}
	private _remoteStream: MediaStream | null;

	get remoteStream() {
		return this._remoteStream;
	}

	private _localStream: MediaStream;

	get localStream() {
		return this._localStream;
	}
	public callState = fsm('uninitialized', {
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
	private socket: Socket<DefaultEventsMap, DefaultEventsMap>;
	private socketID: string;
	private receiverId: string;
	private callerId: string;
	private callerSignal: Peer.SignalData | null;
	private peer: Peer.Instance | null;
	private cancelCallTimer: NodeJS.Timeout;
	private rejectCallTimer: NodeJS.Timeout;
	private currentState = 'uninitialized';

	private userId: string;

	private userName: string;
	constructor(userId: string, name: string) {
		this.callState.subscribe((s) => (this.currentState = s));
		this.userId = userId;
		this.userName = name;
		this.socket = io(SIGNAL_SERVER, {
			query: {
				userId: this.userId,
				userName: this.userName
			}
		});

		// Receiving calls
		if (this.socket) {
			this.socket.on('socketId', (id) => {
				this.socketID = id;
				this.callState.receivedSocketId();
			});

			this.socket.on('incomingCall', (data) => {
				this._callerName = data.callerName;
				this.callerSignal = data.signal;
				this.callerId = data.callerId;
				this.callState.receivingCall();
				this.rejectCallTimer = setTimeout(() => {
					this.rejectCall();
				}, CALL_TIMEOUT);
			});

			this.socket.on('callCanceled', () => {
				console.log('Call canceled');
				this.resetCallState();
				this.callState.callCanceled();
				clearTimeout(this.rejectCallTimer);
			});

			this.socket.on('callDisconnected', () => {
				console.log('callDisconnected');
				this.resetCallState();
				this.callState.callEnded();
			});

			this.socket.on('disconnect', () => {
				console.log('Disconnected');
				this.resetCallState();
				this.callState.callEnded();
			});
		}
		this.callState.initialized();
	}
	private resetCallState() {
		this.peer ? this.peer.destroy() : null;
		this.peer = null;
		this._callerName = '';
		this.callerSignal = null;
		this.callerId = '';
		this.receiverId = '';
		this._remoteStream = null;
	}
	public makeCall(receiverId: string, localStream: MediaStream) {
		this.receiverId = receiverId;
		this._localStream = localStream;
		this.callState.makingCall();
		this.cancelCallTimer = setTimeout(() => {
			this.cancelCall();
		}, CALL_TIMEOUT);

		//Set a time then cancel call if no response

		if (this.socket) {
			this.peer = new Peer({
				initiator: true,
				trickle: false,
				stream: localStream
			});

			this.peer.on('signal', (data) => {
				this.socket.emit('makeCall', {
					receiverId: this.receiverId,
					callerName: this.userName,
					callerId: this.userId,
					signalData: data
				});
			});

			this.peer.on('stream', (stream: MediaStream) => {
				console.log('Got stream');
				this._remoteStream = stream;
				this.callState.callConnected();
			});

			this.socket.on('callAccepted', (signal) => {
				if (this.peer?.writable) {
					this.peer?.signal(signal); //establish connection
				}
				this.callState.callAccepted();
				clearTimeout(this.cancelCallTimer);
			});

			this.socket.on('callRejected', () => {
				this.resetCallState();
				this.callState.callRejected();
				clearTimeout(this.cancelCallTimer);
			});

			this.peer.on('close', () => {
				this.resetCallState();
				this.callState.callEnded();
			});
		}
	}

	public acceptCall(localStream: MediaStream) {
		clearTimeout(this.rejectCallTimer);

		this.callState.acceptCall();

		this.peer = new Peer({
			initiator: false, // receiving call
			trickle: false,
			stream: localStream
		});

		if (this.callerSignal) {
			this.peer.signal(this.callerSignal);
		}

		if (this.socket) {
			this.peer.on('signal', (data) => {
				// This is data that needs to be passed from peer to peer.
				// Can use other methods, ie. gundb
				this.socket.emit('acceptCall', {
					signal: data,
					callerId: this.callerId
				});
			});
		}

		this.peer.on('stream', (stream: MediaStream) => {
			this._remoteStream = stream;
			this.callState.callConnected();
		});

		this.peer.on('close', () => {
			this.socket.off('callAccepted');
			this.resetCallState();
			this.callState.callEnded();
		});
	}

	public rejectCall() {
		clearTimeout(this.rejectCallTimer);

		this.socket.emit('rejectCall', {
			signal: this.callerSignal,
			callerId: this.callerId
		});
		this.callState.rejectCall();
	}

	public cancelCall() {
		clearTimeout(this.cancelCallTimer);

		console.log('cancelCall');
		this.socket.emit('cancelCall', {
			receiverId: this.receiverId
		});
		this.callState.cancelCall();
		this.resetCallState();
	}

	public hangUp() {
		console.log('Current state:', this.currentState);
		if (this.currentState === 'connectedAsReceiver') {
			console.log('Hangup on ', this.callerId);
			if (this.socket) {
				this.socket.emit('disconnectCall', { userId: this.callerId });
			}
		} else if (this.currentState === 'connectedAsCaller') {
			console.log('Hangup on ', this.receiverId);
			if (this.socket) {
				this.socket.emit('disconnectCall', { userId: this.receiverId });
			}
		}

		if (this.peer) {
			this.peer.emit('close');
		}

		this.resetCallState();
		this.callState.hangUp();
	}
}

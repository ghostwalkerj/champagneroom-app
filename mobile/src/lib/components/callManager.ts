import callMachine from '$lib/machines/callMachine';
import { DataConnection, MediaConnection, Peer } from 'peerjs';
import { writable } from 'svelte/store';
import { interpret, InterpreterFrom } from 'xstate';

const VITE_CALL_TIMEOUT = import.meta.env.VITE_CALL_TIMEOUT;

const CALL_TIMEOUT = Number.parseInt(VITE_CALL_TIMEOUT || '30000');

export default class CallManager {
	private _destroyed = false;
	private _userId = '';
	private _callService: InterpreterFrom<typeof callMachine>;
	private _peer: Peer;
	private _noAnswerTimer: NodeJS.Timeout | undefined;
	private _unansweredTimer: NodeJS.Timeout | undefined;
	private _mediaConnection: MediaConnection | undefined;
	private _dataConnection: DataConnection | undefined;
	private _remoteStream: MediaStream | undefined;

	public callerName = writable('');

	public get callService() {
		return this._callService;
	}

	public get remoteStream() {
		return this._remoteStream;
	}

	private _resetCallState = () => {
		console.log('Reset call state');
		this._dataConnection?.close();
		this._mediaConnection?.close();
		this._remoteStream?.getTracks().forEach((track) => track.stop());
		this._dataConnection = undefined;
		this._mediaConnection = undefined;
		this._remoteStream = undefined;

		clearTimeout(this._unansweredTimer);
		clearTimeout(this._noAnswerTimer);
	};

	private _connect2PeerServer = (userId?: string) => {
		this._callService.send({ type: 'CONNECT PEER SERVER' });
		return userId ? new Peer(userId, { debug: 1 }) : new Peer({ debug: 1 });
	};

	private _ignoreCall = () => {
		clearTimeout(this._unansweredTimer);
		this._callService.send({ type: 'CALL UNANSWERED' });
	};

	public cancelCall = () => {
		this._callService.send({ type: 'CALL CANCELLED' });
		this._resetCallState();
	};

	public makeCall = (receiverId: string, callerName: string, localStream: MediaStream) => {
		if (this._destroyed) {
			throw new Error('VideoCall is destroyed');
		}

		this._callService.send({ type: 'CALL OUTGOING' });
		this._noAnswerTimer = setTimeout(() => {
			this._callService.send({ type: 'CALL UNANSWERED' });
			this._resetCallState();
		}, CALL_TIMEOUT + 10000);

		this._mediaConnection = this._peer.call(receiverId, localStream, {
			metadata: { callerName },
		});

		this._dataConnection = this._peer.connect(receiverId, {
			metadata: { callerName },
		});

		if (!this._mediaConnection) {
			console.log('Error making call');
			this._resetCallState();
			return;
		}

		this._mediaConnection.on('stream', (remoteStream) => {
			this._remoteStream = remoteStream;
			this._callService.send({ type: 'CALL CONNECTED' });
			clearTimeout(this._noAnswerTimer);
		});

		this._mediaConnection.on('close', () => {
			console.log('Media connection closed');
			this._resetCallState();
		});

		this._dataConnection.on('open', () => {
			console.log('Data connection opened');
		});

		this._dataConnection.on('close', () => {
			console.log('Data connection closed');
			this._callService.send({ type: 'CALL DISCONNECTED' });
		});
	};

	public rejectCall = () => {
		this._callService.send({ type: 'CALL REJECTED' });
		this._resetCallState();
	};

	public acceptCall = (localStream: MediaStream) => {
		this._callService.send({ type: 'CALL ACCEPTED' });
		this._mediaConnection?.answer(localStream);
		this._mediaConnection?.on('stream', (remoteStream) => {
			this._remoteStream = remoteStream;
			this._callService.send({ type: 'CALL CONNECTED' });
			clearTimeout(this._unansweredTimer);
		});
		this._mediaConnection?.on('close', () => {
			this._callService.send({ type: 'CALL DISCONNECTED' });
		});
	};

	public endCall = () => {
		this._callService.send({ type: 'CALL HANGUP' });
		this._resetCallState();
	};

	public destroy = () => {
		console.log('Destroying video call');
		this._resetCallState();
		this._destroyed = true;
		this._peer.destroy();
		this._callService.send({ type: 'PEER DESTROYED' });
		this._callService.stop();
	};

	constructor (userId?: string) {
		this._callService = interpret(callMachine).start();
		this._userId = userId || '';
		this._peer = this._connect2PeerServer(this._userId);

		// Events
		this._peer.on('open', () => {
			this._callService.send({ type: 'CONNECT PEER SUCCESS' });
		});

		this._peer.on('call', (mediaConnection) => {
			this._callService.send({ type: 'CALL INCOMING' });
			this.callerName.set(mediaConnection.metadata.callerName || 'Anonymous');
			this._unansweredTimer = setTimeout(() => {
				this._ignoreCall();
			}, CALL_TIMEOUT);
		});

		this._peer.on('error', (err: Error) => {
			if (!this._destroyed) {
				console.log('error', err);
				this._callService.send({ type: 'CONNECT PEER LOST' }); //TODO: What happens if in call

				setTimeout(() => {
					console.log('Attempting to reconnect');
					if (!this._peer.destroyed && this._peer.disconnected) {
						this._peer.reconnect();
					}
				}, 5000);
			}
		});

		this._peer.on('disconnected', () => {
			if (!this._destroyed) {
				this._callService.send({ type: 'CONNECT PEER LOST' }); //TODO: What happens if in call
				setTimeout(() => {
					console.log('Attempting to reconnect');
					if (!this._peer.destroyed && this._peer.disconnected) {
						this._peer.reconnect();
					}
				}, 5000);
			}
		});

		this._peer.on('connection', (dataConnection) => {
			this._dataConnection = dataConnection;
			console.log('Data connection opened');
			this._dataConnection.on('data', (data) => {
				console.log('Data received', data);
			});
			this._dataConnection.on('close', () => {
				this._callService.send({ type: 'CALL DISCONNECTED' });
				this._resetCallState();
			});
		});
	};
}
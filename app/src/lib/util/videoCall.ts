import { callMachine } from '$lib/machines/callMachine';
import { Peer } from 'peerjs';
import { readable, writable } from 'svelte/store';
import { interpret } from 'xstate';

const CALL_TIMEOUT = Number.parseInt(process.env.VITE_CALL_TIMEOUT || '30000');

export const videoCall = (userId?: string) => {
	let receiverId: string;
	let noAnswerTimer: NodeJS.Timeout;
	let rejectCallTimer: NodeJS.Timeout;
	let destroyed = false;
	const _callState = writable<typeof callMachine.initialState>(callMachine.initialState);

	const callState = readable<typeof callMachine.initialState>(callMachine.initialState, (set) => {
		_callState.subscribe((state) =>
			set(state)
		);
	});

	const callService = interpret(callMachine).start();

	callService.onTransition((state) => {
		if (state.changed) {
			console.log('call state changed', state.value);
			_callState.set(state);
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

	const connect2PeerServer = (userId?: string) => {
		console.log('connect2PeerServer: ', userId);
		callService.send({ type: 'CONNECT PEER SERVER' });
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
		receiverId = '';
		_remoteStream.set(null);
		clearTimeout(rejectCallTimer);
		clearTimeout(noAnswerTimer);
	};

	// Events
	peer.on('open', () => {
		console.log('Connected to peer server');
		callService.send({ type: 'CONNECT PEER SUCCESS' });
	});

	peer.on('call', (_call) => {
		console.log('Received call');
		callService.send({ type: 'CALL INCOMING' });
		mediaConnection = _call;
		_callerName.set(mediaConnection.metadata.callerName);

		rejectCallTimer = setTimeout(() => {
			rejectCall();
		}, CALL_TIMEOUT);
	});

	peer.on('error', (err: Error) => {
		if (!destroyed) {
			console.log('error', err);
			callService.send({ type: 'CONNECT PEER LOST' }); //TODO: What happens if in call

			setTimeout(() => {
				console.log('Attempting to reconnect');
				if (!peer.destroyed) {
					peer.destroy();
				}
				peer = connect2PeerServer(userId);
			}, 5000);
		}
	});

	peer.on('connection', (conn) => {
		dataConnection = conn;
		console.log('Data connection opened');

		dataConnection.on('data', (data) => {
			console.log('Got data', data);
		});

		dataConnection.on('close', () => {
			console.log('Data connection closed');
			callService.send({ type: 'CALL DISCONNECTED' });
			resetCallState();
		});
	});

	peer.on('disconnected', () => {
		if (!destroyed) {
			console.log('Disconnected from server');
			callService.send({ type: 'CONNECT PEER LOST' }); //TODO: What happens if in call
			setTimeout(() => {
				console.log('Attempting to reconnect');
				if (!peer.destroyed) {
					peer.destroy();
				}
				peer = connect2PeerServer(userId);
			}, 5000);
		}
	});

	const cancelCall = () => {
		console.log('cancelCall');
		callService.send({ type: 'CALL CANCELLED' });
		resetCallState();
	};

	const makeCall = (_receiverId: string, callerName: string, localStream: MediaStream) => {
		receiverId = _receiverId;
		callService.send({ type: 'CALL OUTGOING' });
		noAnswerTimer = setTimeout(() => {
			callService.send({ type: 'CALL UNANSWERED' });
			resetCallState();
		}, CALL_TIMEOUT);

		mediaConnection = peer.call(receiverId, localStream, { metadata: { callerName } });

		if (mediaConnection) {
			mediaConnection.on('stream', (remoteStream) => {
				_remoteStream.set(remoteStream);
				callService.send({ type: 'CALL CONNECTED' });
				clearTimeout(noAnswerTimer);
			});
			mediaConnection.on('close', () => {
				console.log('Call closed');
				resetCallState();
			});

			dataConnection = peer.connect(receiverId, { metadata: { callerName } });
			dataConnection.on('open', () => {
				console.log('Data connection opened');
			});
			dataConnection.on('close', () => {
				console.log('Data connection closed');
				callService.send; ({ type: 'CALL DISCONNECTED' });
			});
		} else {
			console.log('Error making call');
			resetCallState();
		}
	};

	const rejectCall = () => {
		clearTimeout(rejectCallTimer);
		callService.send; ({ type: 'CALL REJECTED' });
		resetCallState();
	};

	const acceptCall = (localStream: MediaStream) => {
		callService.send({ type: 'CALL ACCEPTED' });
		mediaConnection.answer(localStream);
		mediaConnection.on('stream', (remoteStream) => {
			callService.send({ type: 'CALL CONNECTED' });
			clearTimeout(rejectCallTimer);

			_remoteStream.set(remoteStream);
		});
		mediaConnection.on('close', () => {
			console.log('Call closed');
			callService.send; ({ type: 'CALL DISCONNECTED' });
		});
	};

	const hangUp = () => {
		callService.send; ({ type: 'CALL HANGUP' });
		resetCallState();
	};

	const destroy = () => {
		destroyed = true;
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
	};
};

export type VideoCallType = ReturnType<typeof videoCall>;

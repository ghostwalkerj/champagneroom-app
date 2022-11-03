import { PUBLIC_CALL_TIMEOUT } from '$env/static/public';
import callMachine from '$lib/machines/callMachine';
import { Peer } from 'peerjs';
import { readable, writable } from 'svelte/store';
import { interpret } from 'xstate';

const CALL_TIMEOUT = Number.parseInt(PUBLIC_CALL_TIMEOUT || '30000');

export const videoCall = (userId?: string) => {
	let receiverId: string;
	let noAnswerTimer: NodeJS.Timeout;
	let unansweredTimer: NodeJS.Timeout;
	let destroyed = false;

	const callService = interpret(callMachine).start();

	const _remoteStream = writable<MediaStream | null>(null);
	const remoteStream = readable<MediaStream | null>(null, (set) => {
		_remoteStream.subscribe((stream) => {
			set(stream);
		});
	});

	const _callerName = writable<string | null>(null);
	const callerName = readable<string | null>(null, (set) => {
		_callerName.subscribe((name) => {
			set(name);
		});
	});

	const _callState = writable(callMachine.initialState);
	const callState = readable(callMachine.initialState, (set) => {
		_callState.subscribe((state) => {
			set(state);
		});
	});

	callService.onTransition((state) => {
		_callState.set(state);
	});

	callService.onEvent((event) => {
		console.log('Call Event: ', JSON.stringify(event));
	});

	const connect2PeerServer = (userId?: string) => {
		console.log('connect2PeerServer: ', userId);
		callService.send({ type: 'CONNECT PEER SERVER' });
		return userId ? new Peer(userId, { debug: 1 }) : new Peer({ debug: 1 });
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
		clearTimeout(unansweredTimer);
		clearTimeout(noAnswerTimer);
	};

	// Events
	peer.on('open', () => {
		callService.send({ type: 'CONNECT PEER SUCCESS' });
	});

	peer.on('call', (_call) => {
		callService.send({ type: 'CALL INCOMING' });
		mediaConnection = _call;
		_callerName.set(mediaConnection.metadata.callerName);
		unansweredTimer = setTimeout(() => {
			ignoreCall();
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
			callService.send({ type: 'CALL DISCONNECTED' });
			resetCallState();
		});
	});

	peer.on('disconnected', () => {
		if (!destroyed) {
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
		callService.send({ type: 'CALL CANCELLED' });
		resetCallState();
	};

	const makeCall = (_receiverId: string, callerName: string, localStream: MediaStream) => {
		receiverId = _receiverId;
		callService.send({ type: 'CALL OUTGOING' });
		noAnswerTimer = setTimeout(() => {
			callService.send({ type: 'CALL UNANSWERED' });
			resetCallState();
		}, CALL_TIMEOUT + 1000);

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
				callService.send;
				({ type: 'CALL DISCONNECTED' });
			});
		} else {
			console.log('Error making call');
			resetCallState();
		}
	};

	const ignoreCall = () => {
		clearTimeout(unansweredTimer);
		callService.send({ type: 'CALL UNANSWERED' });
		resetCallState();
	};

	const acceptCall = (localStream: MediaStream) => {
		callService.send({ type: 'CALL ACCEPTED' });
		mediaConnection.answer(localStream);
		mediaConnection.on('stream', (remoteStream) => {
			callService.send({ type: 'CALL CONNECTED' });
			clearTimeout(unansweredTimer);

			_remoteStream.set(remoteStream);
		});
		mediaConnection.on('close', () => {
			callService.send;
			({ type: 'CALL DISCONNECTED' });
		});
	};

	const hangUp = () => {
		callService.send;
		({ type: 'CALL HANGUP' });
		resetCallState();
	};

	const destroy = () => {
		resetCallState();
		destroyed = true;
		console.log('destroy called');
		peer.destroy();
		callService.stop();
	};

	return {
		makeCall,
		acceptCall,
		hangUp,
		rejectCall: ignoreCall,
		cancelCall,
		callState,
		remoteStream,
		callerName,
		destroy
	};
};

export type VideoCallType = ReturnType<typeof videoCall>;

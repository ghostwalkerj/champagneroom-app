import fsm from 'svelte-fsm';

export type VideoStreamOptions = {
	video: {
		width: number;
		height: number;
		frameRate: {
			min: number;
			ideal: number;
		};
	};
	audio: boolean;
};

export const userStream = async (options: Partial<VideoStreamOptions> = {}) => {
	let videoTrack: MediaStreamTrack;
	let audioTrack: MediaStreamTrack;
	let mediaStream: MediaStream;

	const ops = Object.assign(
		{
			video: {
				width: 1280,
				height: 720,
				frameRate: {
					ideal: 60,
					min: 15
				}
			},
			audio: true
		},
		options
	);

	const camState = fsm('uninitialized', {
		uninitialized: {
			initialized() {
				videoTrack.enabled = true;
				return 'CamOn';
			}
		},
		CamOn: {
			toggleCam() {
				videoTrack.enabled = !videoTrack.enabled;
				return 'CamOff';
			},
			turnCamOff() {
				videoTrack.enabled = false;
				return 'CamOff';
			}
		},
		CamOff: {
			toggleCam() {
				videoTrack.enabled = !videoTrack.enabled;
				return 'CamOn';
			},
			turnCamOn() {
				videoTrack.enabled = true;
				return 'CamOn';
			}
		}
	});

	const micState = fsm('uninitialized', {
		uninitialized: {
			initialized() {
				audioTrack.enabled = true;
				return 'MicOn';
			}
		},
		MicOn: {
			toggleMic() {
				audioTrack.enabled = !audioTrack.enabled;
				return 'MicOff';
			},
			turnMicOff() {
				audioTrack.enabled = false;
				return 'MicOff';
			}
		},
		MicOff: {
			toggleMic() {
				audioTrack.enabled = !audioTrack.enabled;
				return 'MicOn';
			},
			turnMicOn() {
				audioTrack.enabled = true;
				return 'MicOn';
			}
		}
	});

	try {
		mediaStream = await navigator.mediaDevices.getUserMedia(ops);
		const videoStreams = mediaStream.getVideoTracks();
		const audioStreams = mediaStream.getAudioTracks();
		videoTrack = videoStreams[0];
		audioTrack = audioStreams[0];
		camState.initialized();
		micState.initialized();
	} catch (error) {
		console.log('get UserStream error: ', error);
		throw error;
	}

	return {
		mediaStream,
		camState,
		micState
	};
};

export type UserStreamType = ReturnType<typeof userStream>;

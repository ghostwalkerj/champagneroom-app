import createMediaToggleMachine, {
  type MediaToggleMachineType,
} from '$lib/machines/mediaToggleMachine';
import { readable, writable } from 'svelte/store';

export type VideoStreamOptions = {
  video: {
    width:
      | number
      | {
          min?: number;
          ideal?: number;
          exact?: number;
          max?: number;
        };
    height:
      | number
      | {
          min?: number;
          ideal?: number;
          exact?: number;
          max?: number;
        };
    frameRate:
      | number
      | {
          min?: number;
          ideal?: number;
          exact?: number;
          max?: number;
        };
  };
  audio: boolean;
};

export const userStream = async (options: Partial<VideoStreamOptions> = {}) => {
  let videoTrack: MediaStreamTrack;
  let audioTrack: MediaStreamTrack;
  const _mediaStream = writable<MediaStream | null>(null);
  const mediaStream = readable<MediaStream | null>(null, set => {
    _mediaStream.subscribe(stream => {
      set(stream);
    });
  });
  let stream: MediaStream;

  const ops = Object.assign(
    {
      video: {
        width: { ideal: 4096 },
        height: { ideal: 2160 },
        frameRate: {
          ideal: 60,
          min: 30,
        },
        facingMode: 'user',
      },
      audio: true,
    },
    options
  );

  let camMachine: MediaToggleMachineType;
  let micMachine: MediaToggleMachineType;

  try {
    stream = await navigator.mediaDevices.getUserMedia(ops);
    _mediaStream.set(stream);
    const videoStreams = stream.getVideoTracks();
    const audioStreams = stream.getAudioTracks();
    videoTrack = videoStreams[0];
    audioTrack = audioStreams[0];
    camMachine = createMediaToggleMachine(videoTrack);
    micMachine = createMediaToggleMachine(audioTrack);
  } catch (error) {
    console.log('get UserStream error: ', error);
    throw error;
  }

  const stop = () => {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  };

  return {
    mediaStream,
    camMachine,
    micMachine,
    stop,
  };
};

export type UserStreamType = ReturnType<typeof userStream>;

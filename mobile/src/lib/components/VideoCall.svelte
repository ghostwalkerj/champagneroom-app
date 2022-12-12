<script lang="ts">
  import type {
    MediaToggleMachineServiceType,
    MediaToggleMachineStateType,
  } from '$lib/machines/mediaToggleMachine';
  import { userStream, type UserStreamType } from '$lib/util/userStream';
  import type CallManager from './callManager';

  import { f7, Icon } from 'framework7-svelte';
  import { onDestroy } from 'svelte';
  import { interpret } from 'xstate';
  import type { Unsubscriber } from 'svelte/store';

  export let callManager: CallManager;
  export let inCall = false;

  export let options: Partial<{
    makeCall: boolean;
    rejectCall: boolean;
    answerCall: boolean;
    hangup: boolean;
    cam: boolean;
    mic: boolean;
    cancel: boolean;
  }> = {};

  let us: Awaited<UserStreamType>;

  // UI Controls
  const placeholder = import.meta.env.VITE_BLACK_IMAGE;
  let videoElement: HTMLVideoElement;
  let camState: MediaToggleMachineStateType;
  let micState: MediaToggleMachineStateType;
  let camService: MediaToggleMachineServiceType;
  let micService: MediaToggleMachineServiceType;
  let localStream: MediaStream;
  let remoteStream: MediaStream;
  let unSubLocalStream: Unsubscriber;

  const buttonOptions = Object.assign(
    {
      makeCall: true,
      rejectCall: true,
      answerCall: true,
      hangup: true,
      cam: true,
      mic: true,
      cancel: true,
    },
    options
  );

  const answerCall = async () => {
    if (!us) {
      us = await userStream();
      if (unSubLocalStream) unSubLocalStream();
      unSubLocalStream = us.mediaStream.subscribe(_localStream => {
        if (_localStream) {
          localStream = _localStream;
        }
      });

      camService = interpret(us.camMachine).onTransition(state => {
        camState = state;
      });
      camService.start();

      micService = interpret(us.micMachine).onTransition(state => {
        micState = state;
      });
      micService.start();
    }

    callManager.acceptCall(localStream);
  };

  let callAlert = f7.dialog.create({
    title: 'Incoming pCall',
    text: 'Do you want to answer the call?',
    buttons: [
      {
        text: 'Answer',
        onClick: answerCall,
      },
    ],
  });

  callManager.callService.onTransition(state => {
    console.log(state.value);
    if (state.changed) {
      if (state.matches('receivingCall')) {
        callAlert.open();
      } else {
        callAlert.close();
      }
      if (state.matches('inCall')) {
        inCall = true;
      } else {
        inCall = false;
      }
    }
  });

  callManager.remoteStream.subscribe(_remoteStream => {
    if (_remoteStream) {
      remoteStream = _remoteStream;
    }
  });

  callManager.callerName.subscribe(_callerName => {
    callAlert.setText('pCall from ' + _callerName);
  });

  function startVideo(video) {
    video.srcObject = remoteStream;
    video.muted = true;
    video.load();
    video.play();
  }

  const stopVideo = () => {
    camService?.stop();
    micService?.stop();
    us?.stop();
    unSubLocalStream?.();
    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
    }
  };

  onDestroy(() => {
    stopVideo();
  });
</script>

{#if inCall}
  <div>
    <!-- svelte-ignore a11y-media-has-caption -->
    <video
      bind:this={videoElement}
      muted
      playsinline
      class="h-full object-cover w-full -scale-x-100"
      poster={placeholder}
      use:startVideo
    />
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="absolute inset-0 flex flex-col bg-base-100  text-white p-4  ">
      <div class="flex flex-col items-center w-min">
        <button
          class="h-14 w-14 btn  "
          on:click={() => camService?.send('TOGGLE')}
        >
          {#if camState?.matches('on')}
            <Icon material="videocam" size="34" />
          {:else}
            <Icon material="videocam_off" size="34" />
          {/if}
        </button>
      </div>
      <div class="flex flex-col items-center w-min">
        <button
          class="h-14 w-14 btn"
          on:click={() => micService?.send('TOGGLE')}
        >
          {#if micState?.matches('on')}
            <Icon material="mic" size="34" />
          {:else}
            <Icon material="mic_off" size="34" />
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

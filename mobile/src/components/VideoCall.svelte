<script lang="ts">
  import type {
    MediaToggleMachineServiceType,
    MediaToggleMachineStateType,
  } from '$lib/machines/mediaToggleMachine';
  import { userStream, type UserStreamType } from '$lib/util/userStream';
  import type CallManager from '../lib/callManager';

  import { f7, Icon } from 'framework7-svelte';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { interpret } from 'xstate';

  export let callManager: CallManager;
  export let inCall = false;

  let videoDisplay = 'h-0 z-0';

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

  // I hate this but it works
  const showVideo = () => {
    videoDisplay = 'h-full z-100';
  };

  const hideVideo = () => {
    videoDisplay = 'h-0 z-0';
  };

  const startLocalStream = async () => {
    us = await userStream();
    camService = interpret(us.camMachine).onTransition(state => {
      camState = state;
    });
    camService.start();
    micService = interpret(us.micMachine).onTransition(state => {
      micState = state;
    });
    micService.start();
  };

  const stopLocalStream = () => {
    camService?.stop();
    micService?.stop();
    us?.stop();
    if (unSubLocalStream)
      try {
        unSubLocalStream();
      } catch (e) {}
  };

  const answerCall = async () => {
    showVideo();
    await startLocalStream();
    if (unSubLocalStream)
      try {
        unSubLocalStream();
      } catch (e) {}

    unSubLocalStream = us.mediaStream.subscribe(_localStream => {
      if (_localStream) {
        localStream = _localStream;
        if (!inCall) {
          callManager.acceptCall(_localStream);
        }
      }
    });
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

  function startVideo() {
    if (videoElement) {
      videoElement.srcObject = remoteStream;
      videoElement.muted = true;
      videoElement.load();
      videoElement.play();
    }
  }

  const stopVideo = () => {
    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
    }
  };

  onMount(() => {
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
          showVideo();
        }
        if (state.matches('ready4Call')) {
          inCall = false;
          hideVideo();
          stopLocalStream();
        }
      }
    });

    callManager.remoteStream.subscribe(_remoteStream => {
      if (_remoteStream && _remoteStream !== remoteStream) {
        remoteStream = _remoteStream;
        startVideo();
      }
    });

    callManager.callerName.subscribe(_callerName => {
      callAlert.setText('pCall from ' + _callerName);
    });
  });

  onDestroy(() => {
    stopLocalStream();
    stopVideo();
  });
</script>

<div class={videoDisplay}>
  <!-- svelte-ignore a11y-media-has-caption -->
  <video
    bind:this={videoElement}
    muted
    playsinline
    class="h-full object-cover w-full -scale-x-100"
    poster={placeholder}
    disablePictureInPicture={true}
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
      <button class="h-14 w-14 btn" on:click={() => micService?.send('TOGGLE')}>
        {#if micState?.matches('on')}
          <Icon material="mic" size="34" />
        {:else}
          <Icon material="mic_off" size="34" />
        {/if}
      </button>
    </div>
  </div>
</div>

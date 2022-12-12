<script lang="ts">
  import type {
    MediaToggleMachineServiceType,
    MediaToggleMachineStateType,
  } from '$lib/machines/mediaToggleMachine';
  import { userStream, type UserStreamType } from '$lib/util/userStream';
  import type CallManager from './callManager';

  import { f7, Icon } from 'framework7-svelte';
  import { onMount, onDestroy } from 'svelte';
  import { interpret } from 'xstate';

  export let callManager: CallManager;
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
  let inCall = false;

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

  let callAlert = f7.dialog.create({
    title: 'Incoming pCall',
    text: 'Do you want to answer the call?',
    buttons: [
      {
        text: 'Answer',
        onClick: () => {},
      },
    ],
  });

  // UI Controls
  const placeholder = import.meta.env.VITE_BLACK_IMAGE;
  let videoElement: HTMLVideoElement;
  let camState: MediaToggleMachineStateType;
  let micState: MediaToggleMachineStateType;
  let camService: MediaToggleMachineServiceType;
  let micService: MediaToggleMachineServiceType;

  callManager.callService.onTransition(state => {
    console.log(state.value);
    if (state.changed) {
      if (state.matches('receivingCall')) {
        callAlert.open();
      } else {
        callAlert.close();
      }
    }
  });

  callManager.callerName.subscribe(_callerName => {
    callAlert.setText('pCall from ' + _callerName);
  });

  const startVideo = async () => {
    if (!us) {
      us = await userStream();
    }
    camService = interpret(us.camMachine).onTransition(state => {
      camState = state;
    });
    camService.start();

    micService = interpret(us.micMachine).onTransition(state => {
      micState = state;
    });
    micService.start();

    if (callManager.remoteStream) {
      videoElement.srcObject = callManager.remoteStream;
      videoElement.load();
      videoElement.muted = true;
      videoElement.play();
    }

    videoElement.muted = false;
    videoElement.play();
  };

  const stopVideo = () => {
    camService?.stop();
    micService?.stop();
    us?.stop();

    if (!videoElement) return;
    videoElement.pause();
    videoElement.srcObject = null;
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

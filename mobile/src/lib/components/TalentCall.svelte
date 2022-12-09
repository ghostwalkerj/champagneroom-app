<script lang="ts">
  import type {
    MediaToggleMachineServiceType,
    MediaToggleMachineStateType,
  } from '$lib/machines/mediaToggleMachine';
  import type { UserStreamType } from '$lib/util/userStream';
  import type { VideoCallType } from '$lib/util/videoCall';

  import { Icon } from 'framework7-svelte';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { interpret } from 'xstate';

  export let us: Awaited<UserStreamType>;
  export let vc: Awaited<VideoCallType>;

  const placeholder = import.meta.env.VITE_BLACK_IMAGE;

  // UI Controls
  let videoPlayer: HTMLVideoElement;
  let camState: MediaToggleMachineStateType;
  let micState: MediaToggleMachineStateType;
  let camService: MediaToggleMachineServiceType;
  let micService: MediaToggleMachineServiceType;

  onMount(() => {
    if (us && vc) {
      camService = interpret(us.camMachine).onTransition(state => {
        camState = state;
      });
      camService.start();

      micService = interpret(us.micMachine).onTransition(state => {
        micState = state;
      });
      micService.start();

      const mediaStream = get(vc.remoteStream);
      videoPlayer.srcObject = mediaStream;
      videoPlayer.load();
      videoPlayer.muted = true;
      videoPlayer.play();
    }
  });
</script>

<div>
  <!-- svelte-ignore a11y-media-has-caption -->
  <video
    bind:this={videoPlayer}
    muted
    playsinline
    class="h-full object-cover w-full -scale-x-100 "
    poster={placeholder}
  />
  <!-- svelte-ignore a11y-click-events-have-key-events -->

  <div class="absolute inset-0 flex flex-col bg-base-100  text-white p-4">
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

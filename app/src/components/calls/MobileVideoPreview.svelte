<script lang="ts">
  import type { MediaToggleMachineType } from '$lib/machines/mediaToggleMachine';
  import type { UserStreamType } from '$lib/util/userStream';
  import { useMachine } from '@xstate/svelte';
  import { onMount } from 'svelte';
  import {
    MicIcon,
    MicOffIcon,
    VideoIcon,
    VideoOffIcon,
  } from 'svelte-feather-icons';

  export let us: Awaited<UserStreamType>;

  // UI Controls
  let localVideo: HTMLVideoElement;
  let initialized = false;
  let camState: ReturnType<typeof useMachine<MediaToggleMachineType>>['state'];
  let micState: ReturnType<typeof useMachine<MediaToggleMachineType>>['state'];
  let camSend: ReturnType<typeof useMachine<MediaToggleMachineType>>['send'];
  let micSend: ReturnType<typeof useMachine<MediaToggleMachineType>>['send'];
  let mediaStream: MediaStream;

  $: if (us) {
    ({ state: camState, send: camSend } = useMachine(us.camMachine));
    ({ state: micState, send: micSend } = useMachine(us.micMachine));
    us.mediaStream.subscribe(stream => {
      if (stream) mediaStream = stream;
      initialize();
    });
  }

  onMount(async () => {
    initialize();
  });

  const initialize = () => {
    if (localVideo && mediaStream) {
      localVideo.srcObject = mediaStream;
      localVideo.load();
      localVideo.muted = true;

      camSend('TOGGLE OFF');
      micSend('TOGGLE OFF');

      initialized = true;
    }
  };

  let showOverlay = true;

  const toggleVideo = () => {
    camSend('TOGGLE');
    localVideo.play();
    showOverlay = !showOverlay;
  };
</script>

<div class="flex flex-col">
  <video
    bind:this={localVideo}
    muted
    autoplay
    playsinline
    preload="none"
    class="rounded-xl p-2 max-h-screen -scale-x-100"
    on:click={toggleVideo}
  />
  <!-- svelte-ignore a11y-click-events-have-key-events -->

  {#if showOverlay}
    <div
      class="absolute inset-0 flex justify-center items-center z-10"
      on:click={toggleVideo}
    >
      <p class="text-2xl font-bold">Click to Start Video</p>
    </div>
  {/if}
  {#if initialized}
    <section
      class="flex bg-base-100 flex-shrink-0 text-white p-4 gap-4 items-center justify-center md:rounded-2xl md:gap-8"
    >
      <div class="flex flex-col gap-2 items-center">
        <button class="h-14 w-14 btn btn-circle" on:click={toggleVideo}>
          {#if $camState.matches('on')}
            <VideoIcon size="34" />
          {:else}
            <VideoOffIcon size="34" />
          {/if}
        </button>
        Cam
      </div>
      <div class="flex flex-col gap-2 items-center">
        <button
          class="h-14 w-14 btn btn-circle"
          on:click={() => micSend('TOGGLE')}
        >
          {#if $micState.matches('on')}
            <MicIcon size="34" />
          {:else}
            <MicOffIcon size="34" />
          {/if}
        </button>
        Mic
      </div>
    </section>
  {/if}
</div>

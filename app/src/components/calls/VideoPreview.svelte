<script lang="ts">
  import type {
    MediaToggleMachineServiceType,
    MediaToggleMachineStateType,
  } from '$lib/machines/mediaToggleMachine';
  import type { UserStreamType } from '$lib/util/userStream';
  import { onMount } from 'svelte';
  import {
    MicIcon,
    MicOffIcon,
    VideoIcon,
    VideoOffIcon,
  } from 'svelte-feather-icons';
  import { interpret } from 'xstate';

  // UI Controls
  let localVideo: HTMLVideoElement;
  export let us: Awaited<UserStreamType>;
  let initialized = false;
  let camState: MediaToggleMachineStateType;
  let micState: MediaToggleMachineStateType;
  let camService: MediaToggleMachineServiceType;
  let micService: MediaToggleMachineServiceType;
  let mediaStream: MediaStream;

  onMount(async () => {
    camService = interpret(us.camMachine).onTransition(state => {
      camState = state;
    });
    camService.start();

    micService = interpret(us.micMachine).onTransition(state => {
      micState = state;
    });
    micService.start();

    us.mediaStream.subscribe(stream => {
      if (stream) mediaStream = stream;
      localVideo.srcObject = mediaStream;
      localVideo.load();
      localVideo.muted = true;
      localVideo.play();
    });
    initialized = true;
  });
</script>

<div class=" h-full w-full">
  <div class="w-full p-1 transform -scale-x-100">
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this="{localVideo}" playsinline autoplay></video>
  </div>
  {#if initialized}
    <section
      class="flex bg-base-100 flex-shrink-0 text-white p-4 gap-4 items-center justify-center md:rounded-2xl md:gap-8"
    >
      <div class="flex flex-col gap-2 items-center">
        <button
          class="h-14 w-14 btn btn-circle"
          on:click="{() => camService.send('TOGGLE')}"
        >
          {#if camState?.matches('on')}
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
          on:click="{() => micService.send('TOGGLE')}"
        >
          {#if micState?.matches('on')}
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

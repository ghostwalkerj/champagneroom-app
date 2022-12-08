<script lang="ts">
  import type {
    MediaToggleMachineServiceType,
    MediaToggleMachineStateType,
  } from '$lib/machines/mediaToggleMachine';
  import { userStream, type UserStreamType } from '$lib/util/userStream';

  import { Icon, Page } from 'framework7-svelte';
  import { onMount } from 'svelte';
  import { interpret } from 'xstate';

  let us: Awaited<UserStreamType>;

  // UI Controls
  let localVideo: HTMLVideoElement;
  let initialized = false;
  let camState: MediaToggleMachineStateType;
  let micState: MediaToggleMachineStateType;
  let camService: MediaToggleMachineServiceType;
  let micService: MediaToggleMachineServiceType;
  let mediaStream: MediaStream | null;

  onMount(async () => {
    us = await userStream();
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

<Page name="Video Preview">
  <div class="flex flex-col z-100 ">
    <!-- svelte-ignore a11y-media-has-caption -->
    <video
      bind:this={localVideo}
      muted
      playsinline
      class="rounded-xl p-2 -scale-x-100 max-h-screen"
    />
    <!-- svelte-ignore a11y-click-events-have-key-events -->

    {#if initialized}
      <div class="absolute inset-0 flex flex-col bg-base-100  text-white p-4  ">
        <div class="flex flex-col  items-center w-min">
          <button
            class="h-14 w-14 btn  "
            on:click={() => camService.send('TOGGLE')}
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
            on:click={() => micService.send('TOGGLE')}
          >
            {#if micState?.matches('on')}
              <Icon material="mic" size="34" />
            {:else}
              <Icon material="mic_off" size="34" />
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
</Page>

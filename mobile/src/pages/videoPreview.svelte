<script lang="ts">
  import type { MediaToggleMachineType } from '$lib/machines/mediaToggleMachine';
  import { userStream, type UserStreamType } from '$lib/util/userStream';

  import { useMachine } from '@xstate/svelte';
  import { Icon, Page } from 'framework7-svelte';
  import { onMount } from 'svelte';

  let us: Awaited<UserStreamType>;

  // UI Controls
  let localVideo: HTMLVideoElement;
  let initialized = false;
  let camState: ReturnType<typeof useMachine<MediaToggleMachineType>>['state'];
  let micState: ReturnType<typeof useMachine<MediaToggleMachineType>>['state'];
  let camSend: ReturnType<typeof useMachine<MediaToggleMachineType>>['send'];
  let micSend: ReturnType<typeof useMachine<MediaToggleMachineType>>['send'];
  let mediaStream: MediaStream | null;

  onMount(async () => {
    us = await userStream();
  });

  $: if (us) {
    ({ state: camState, send: camSend } = useMachine(us.camMachine));
    ({ state: micState, send: micSend } = useMachine(us.micMachine));
    us.mediaStream.subscribe(stream => {
      if (stream) mediaStream = stream;
      initialize();
    });
  }

  const initialize = () => {
    if (localVideo && mediaStream) {
      localVideo.srcObject = mediaStream;
      localVideo.load();
      localVideo.muted = true;
      localVideo.play();

      //camSend('TOGGLE OFF');
      //micSend('TOGGLE OFF');

      initialized = true;
    }
  };

  let showOverlay = false;

  // const toggleVideo = () => {
  // camSend('TOGGLE');
  // localVideo.play();
  // showOverlay = !showOverlay;
  // };
</script>

<Page name="Video Preview">
  <div class="flex flex-col z-100">
    <!-- svelte-ignore a11y-media-has-caption -->
    <video
      bind:this={localVideo}
      autoplay
      playsinline
      preload="none"
      class="rounded-xl p-2 max-h-screen -scale-x-100"
    />
    <!-- svelte-ignore a11y-click-events-have-key-events -->

    {#if initialized}
      <section
        class="flex bg-base-100 flex-shrink-0 text-white p-4 gap-4 items-center justify-center md:rounded-2xl md:gap-8 "
      >
        <div class="flex flex-col gap-2 items-center">
          <button
            class="h-14 w-14 btn btn-circle "
            on:click={() => camSend('TOGGLE')}
          >
            {#if $camState.matches('on')}
              <Icon material="videocam" size="34" />
            {:else}
              <Icon material="videocam_off" size="34" />
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
              <Icon material="mic" size="34" />
            {:else}
              <Icon material="mic_off" size="34" />
            {/if}
          </button>
          Mic
        </div>
      </section>
    {/if}
  </div>
</Page>

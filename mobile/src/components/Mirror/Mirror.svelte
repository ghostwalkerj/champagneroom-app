<script>
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import { spring } from 'svelte/motion';

  import {
    deviceList,
    selectedDevices,
  } from 'lib/jitsi-svelte/stores/DeviceListStore';
  import {
    localTracksStore,
    localAudioLevel,
    requestedTracks,
  } from 'lib/jitsi-svelte/stores/LocalTracksStore';

  import Video from '../Video';
  import Audio from '../Audio';

  import ContinueButton from './ContinueButton';
  import DeviceSelector from './DeviceSelector';

  import videoEnabledIcon from './images/video-enabled.svg';
  import videoDisabledIcon from './images/video-disabled.svg';
  import audioEnabledIcon from './images/audio-enabled.svg';
  import audioDisabledIcon from './images/audio-disabled.svg';
  import settingsIcon from './images/settings.svg';

  export let showContinueButton = true;

  const AUDIO_LEVEL_MINIMUM = 0.0;

  const dispatch = createEventDispatcher();

  const audioRequested = requestedTracks.audio;
  const videoRequested = requestedTracks.video;

  // Local state
  let requestBlocked = false;
  let letMeHearMyself = false;

  let hasPermission = false;
  let advancedSettings = false;
  let advancedSettingsSupported = JitsiMeetJS.util.browser.isChrome();

  // Animation springs
  let audioLevelSpring = spring(0, {
    stiffness: 0.3,
    damping: 0.8,
  });

  let videoPositionSpring = spring(0, {
    stiffness: 0.5,
    damping: 0.3,
  });
  const shakeInactiveVideo = () => {
    videoPositionSpring.set(10);
    setTimeout(() => videoPositionSpring.set(0), 100);
  };

  const toggleAudioRequested = () => ($audioRequested = !$audioRequested);

  const toggleVideoRequested = () => ($videoRequested = !$videoRequested);

  const toggleAdvancedSettings = () => (advancedSettings = !advancedSettings);

  // const audioLevelChanged = (level) => audioLevelSpring.set(level)
  $: audioLevelSpring.set($localAudioLevel);

  function setRequestBlocked(blocked) {
    if (blocked) {
      if (requestBlocked) {
        // Visual feedback already indicates red,
        // so shake it to emphasize error
        shakeInactiveVideo();
      }
      requestBlocked = true;
    } else {
      requestBlocked = false;
    }
  }

  /**
   * localTracks, audioRequested, videoRequested
   * @returns hasPermission, blocked(?), tracks
   */
  async function requestPermissions() {
    hasPermission = await localTracksStore.request();

    // Visually indicate that the request was blocked if we don't have permission
    setRequestBlocked(!hasPermission);

    // After asking for permission, it's possible the browser will now allow us
    // to see more information about the devices available to the user, so requery
    await deviceList.requery();
  }

  const handleDone = () => {
    dispatch('done');
  };

  const handleHelp = () => {
    alert('TODO');
  };

  onMount(async () => {
    requestPermissions();
  });

  onDestroy(() => {
    localTracksStore.dispose();
  });
</script>

{#if hasPermission}
  <div
    class="rounded-xl object-cover h-full w-full flex justify-center overflow-hidden relative"
  >
    {#if letMeHearMyself}
      <Audio track={$localTracksStore.audio} />
    {/if}
    <Video track={$localTracksStore.video} mirror={true} autoPlay={false} />
    <div class="absolute inset-x-0 top-0 text-center rounded-xl ">
      {#if !$audioRequested && !$videoRequested}
        <div class="p-4 rounded-xl opacity-80 bg-slate-900">
          Join with cam and mic off
        </div>
      {:else if !$videoRequested}
        <div class="p-4 rounded-xl opacity-80 bg-slate-900">
          Join with cam off
        </div>
      {:else if !$audioRequested}
        <div class="p-4 rounded-xl opacity-80 bg-slate-900">
          Join with mic off
        </div>
      {:else}
        <div />
      {/if}
    </div>
    <div class="absolute inset-x-1 bottom-0.5 flex">
      {#if advancedSettingsSupported}
        <button class="corner" on:click={toggleAdvancedSettings}
          ><img src={settingsIcon} width="32" alt="Settings" /></button
        >
      {/if}
      <button
        on:click={toggleVideoRequested}
        class:track-disabled={!$videoRequested}
      >
        {#if $videoRequested}
          <img src={videoEnabledIcon} width="32" alt="Video Enabled" />
        {:else}
          <img src={videoDisabledIcon} width="32" alt="Video Disabled" />
        {/if}
      </button>
      <button
        on:click={toggleAudioRequested}
        class:audio-level={$audioRequested &&
          $audioLevelSpring > AUDIO_LEVEL_MINIMUM}
        class:track-disabled={!$audioRequested}
        style="--audio-level:{($audioLevelSpring * 85 + 15).toFixed(2) + '%'}"
      >
        {#if $audioRequested}
          <img src={audioEnabledIcon} width="32" alt="Audio Enabled" />
        {:else}
          <img src={audioDisabledIcon} width="32" alt="Audio Disabled" />
        {/if}
      </button>
    </div>
  </div>

  {#if showContinueButton}
    <div class="p-4 w-screen">
      <ContinueButton on:click={handleDone}>Continue</ContinueButton>
    </div>
  {/if}

  {#if advancedSettings}
    <div>
      <DeviceSelector
        selected={selectedDevices}
        on:changed={_ => {
          requestPermissions();
        }}
      />
    </div>
  {/if}
{:else}
  <div
    class="h-56 bg-gray-500 w-screen rounded-xl flex justify-center overflow-hidden relative p-1"
  >
    <div
      class="absolute  inset-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 place-content-center flex"
    >
      <img src={videoDisabledIcon} width="75" alt="Video Disabled" />
    </div>
    <div class="p-4 rounded-xl">
      {#if requestBlocked}
        Cam and mic are blocked
        <button on:click={handleHelp}>(Need help?)</button>
      {:else}Cam and mic are not active{/if}
    </div>
  </div>

  <p class="p-4">
    For others to see and hear you, your browser will request access to your cam
    and mic.
  </p>

  <div class="p-4 w-screen">
    <ContinueButton on:click={requestPermissions}>
      {#if requestBlocked}Try Again{:else}Request Permissions{/if}
    </ContinueButton>
  </div>
{/if}

<style>
  .audio-level {
    position: relative;
  }
  .audio-level:before {
    content: ' ';
    display: block;
    position: absolute;
    width: 100%;
    height: var(--audio-level);
    max-height: 100%;
    bottom: 0;
    left: 0;
    background-color: rgba(143, 70, 180, 0.7);
    border-bottom-right-radius: 8px;
    border-bottom-left-radius: 8px;
  }
</style>

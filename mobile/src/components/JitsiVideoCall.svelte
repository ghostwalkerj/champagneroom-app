<script lang="ts">
  import {
    createConnectionStore,
    DEFAULT_JITSI_CONFIG,
  } from 'lib/jitsi-svelte';

  import Mirror from './Mirror';

  // Note that as soon as you provide a ConfigStore for the connection, it will connect.
  // If you want to delay connecting until some future point, just use 'null' as the store.
  const connection = createConnectionStore(DEFAULT_JITSI_CONFIG, 'pcall-test');

  const conferences = connection.conferencesStore;

  // The conference room to join. You can join now or later (e.g. after some action). You
  // can join multiple conferences simultaneously. Joining a conference is independent of
  // actually sharing your video/audio--the Mirror page lets the user set up their video/
  // audio and share it with the conference room.
  conferences.join('pcall-test');

  // You can also join a conference later, e.g. after some action.
  // conferences.join('relm-test');
</script>

<div class="h-full w-full relative">
  <Mirror showContinueButton={false} />
  <div class="absolute top-2 right-2 animate-pulse ">
    {#if $connection}
      <div class="h-2 w-2 rounded-full border-2 bg-green-600" />
    {:else}
      <div class="h-2 w-2 rounded-full border-2  bg-red-600" />
    {/if}
  </div>
</div>

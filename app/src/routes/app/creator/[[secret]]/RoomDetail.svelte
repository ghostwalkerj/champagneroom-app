<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import type { SuperValidated } from 'sveltekit-superforms';
  import urlJoin from 'url-join';
  import type { z } from 'zod';

  import { page } from '$app/stores';

  import type { roomCRUDSchema, RoomDocument } from '$lib/models/room';

  import config from '$lib/config';

  import CopyText from '$components/CopyText.svelte';
  import { RoomStore } from '$stores';

  export let roomForm: SuperValidated<z.infer<typeof roomCRUDSchema>>;

  let room = roomForm.data;
  let roomUnSub: Unsubscriber;

  const modalStore = getModalStore();

  const roomModal: ModalSettings = {
    type: 'component',
    component: 'CRUDRoomForm',
    title: 'Update Room',
    meta: {
      action: '?/upsert_room',
      form: roomForm
    }
  };

  $: roomUrl = urlJoin($page.url.origin, config.PATH.room, room.uniqueUrl);

  onMount(() => {
    if (room._id) {
      roomUnSub = RoomStore(room as RoomDocument).subscribe((data) => {
        if (!data) {
          return;
        }
        room = data;
        roomModal.meta.form.data = data;
      });
    }
  });

  onDestroy(() => {
    roomUnSub?.();
  });
</script>

<div
  class="bg-custom flex flex-col items-center justify-center gap-4 rounded p-4"
>
  <div class="flex flex-col items-center gap-0 text-center">
    <h2 class="flex items-center gap-2 text-xl font-semibold">
      <Icon class="text-secondary-500" icon="icon-park-outline:door-handle" />
      Room
    </h2>
  </div>

  {#if room._id}
    <div class="flex flex-col items-center text-center text-white">
      <span class="font-bold text-white">{room.name}</span>
      {#if room.tagLine}<div class="text-sm">{room.tagLine}</div>{/if}
      <div class="m-4 max-w-fit overflow-hidden">
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src={room.bannerImageUrl} class="w-32 rounded-container-token" />
      </div>
      <div>
        URL:
        <CopyText
          copyValue={roomUrl}
          class="neon-primary anchor variant-soft-primary mb-1 font-semibold"
        >
          {decodeURIComponent(room.uniqueUrl)}</CopyText
        >
      </div>
    </div>
    <button
      type="button"
      class="neon-secondary variant-soft-secondary btn btn-sm"
      on:click={() => modalStore.trigger(roomModal)}>Edit My Room</button
    >
  {:else}
    <div class="text-secondary-500">No room found</div>
    <button
      type="button"
      class="neon-secondary variant-soft-secondary btn btn-sm"
      on:click={() => modalStore.trigger(roomModal)}>Create My Room</button
    >
  {/if}
</div>

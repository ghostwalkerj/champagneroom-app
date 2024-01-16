<script lang="ts">
  import { page } from '$app/stores';
  import CopyText from '$components/forms/CopyText.svelte';
  import Config from '$lib/models/config';
  import { roomZodSchema } from '$lib/models/room';
  import Icon from '@iconify/svelte';
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import type { SuperValidated } from 'sveltekit-superforms';
  import urlJoin from 'url-join';

  export let roomForm: SuperValidated<typeof roomZodSchema>;
  $: room = roomZodSchema.parse(roomForm.data);

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

  $: roomUrl = urlJoin(
    $page.url.origin,
    Config.PATH.room,
    roomForm.data.uniqueUrl
  );
</script>

<div
  class="bg-custom p-4 rounded flex flex-col gap-4 justify-center items-center"
>
  <div class="flex flex-col gap-0 items-center text-center">
    <h2 class="text-xl font-semibold flex gap-2 items-center">
      <Icon class="text-secondary" icon="icon-park-outline:door-handle" />
      Room
    </h2>
  </div>

  {#if room}
    <div class="flex flex-col text-base text-center items-center">
      <div>
        Name: <span class="font-semibold">{room.name}</span>
      </div>
      <div class="text-sm">"{room.tagLine}""</div>
      bannerImageUrl
      <div class="overflow-hidden m-4 max-w-fit">
        <!-- svelte-ignore a11y-missing-attribute -->
        <img
          src={room.coverImageUrl}
          class="rounded-container-token max-w-full"
        />
      </div>
      <div>
        URL:
        <CopyText
          copyValue={roomUrl}
          class="anchor neon-primary font-semibold variant-soft-primary mb-1"
        >
          {decodeURIComponent(room.uniqueUrl)}</CopyText
        >
      </div>
    </div>
    <button
      type="button"
      class="btn variant-soft-secondary btn-sm neon-secondary"
      on:click={() => modalStore.trigger(roomModal)}>Edit My Room</button
    >
  {:else}
    <div class="text-info">No room found</div>
    <button
      type="button"
      class="btn variant-soft-secondary btn-sm neon-secondary"
      on:click={() => modalStore.trigger(roomModal)}>Create My Room</button
    >
  {/if}
</div>

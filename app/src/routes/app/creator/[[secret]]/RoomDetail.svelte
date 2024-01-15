<script lang="ts">
  import { page } from '$app/stores';
  import Config from '$lib/config';
  import type { RoomDocumentType, roomZodSchema } from '$lib/models/room';
  import {
    getModalStore,
    popup,
    type ModalSettings,
    type PopupSettings
  } from '@skeletonlabs/skeleton';
  import type { SuperValidated } from 'sveltekit-superforms';
  import urlJoin from 'url-join';
  import Icon from '@iconify/svelte';
  import { copy, type CopyDetail } from '@svelte-put/copy';

  export let room: RoomDocumentType;
  export let roomForm: SuperValidated<typeof roomZodSchema>;

  const modalStore = getModalStore();

  const roomModal: ModalSettings = {
    type: 'component',
    component: 'CRUDRoomForm',
    title: 'Update Room',
    meta: {
      action: '?/upsert_room',
      form: roomForm,
      room
    }
  };

  const popupHover: PopupSettings = {
    event: 'hover',
    target: 'popupHover',
    placement: 'top'
  };

  let copied = '';
  function handleCopied(e: CustomEvent<CopyDetail>) {
    copied = e.detail.text;
    navigator.clipboard.writeText(copied);
    setTimeout(() => {
      copied = '';
    }, 2000);
  }

  const roomUrl =
    room && urlJoin($page.url.origin, Config.PATH.room, room.uniqueUrl);
</script>

{#if copied === ''}
  <div
    class="neon-primary p-4 rounded bg-custom border-2 border-primary-content"
    data-popup="popupHover"
  >
    {roomUrl}
  </div>
{/if}

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
      <div class="overflow-hidden m-4 max-w-fit">
        <!-- svelte-ignore a11y-missing-attribute -->
        <img
          src={room.coverImageUrl}
          class="rounded-container-token max-w-full"
        />
      </div>
      <div>
        URL:
        {#if copied}
          <span class="text-success">Copied!</span>
        {:else}
          <button
            class="anchor text-primary-content font-semibold"
            use:copy={{ text: roomUrl }}
            use:popup={popupHover}
            on:copied={handleCopied}
            on:click|preventDefault
          >
            {room.uniqueUrl}</button
          >
        {/if}
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

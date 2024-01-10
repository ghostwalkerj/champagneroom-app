<script lang="ts">
  import { page } from '$app/stores';
  import Config from '$lib/config';
  import type { RoomDocumentType, roomZodSchema } from '$lib/models/room';
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import type { SuperValidated } from 'sveltekit-superforms';
  import urlJoin from 'url-join';

  export let room: RoomDocumentType;
  export let roomForm: SuperValidated<typeof roomZodSchema>;

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

  const roomUrl = urlJoin($page.url.origin, Config.PATH.room, room.uniqueUrl);
</script>

<div class="card px-6 pb-6 bg-primary rounded-xl text-center">
  <header class="card-header text-primary-content font-bold text-2xl p-3">
    My Room
  </header>

  {#if room}
    <div class="flex flex-col">
      <div>
        {room.name}
      </div>
      <div>
        <a class="anchor text-primary-content font-semibold" href={roomUrl}>
          {room.uniqueUrl}</a
        >
      </div>
    </div>
    <button
      type="button"
      class="btn variant-filled-secondary mt-4"
      on:click={() => modalStore.trigger(roomModal)}>Edit My Room</button
    >
  {:else}
    <div class="text-info">No room found</div>
    <button
      type="button"
      class="btn variant-filled-secondary mt-4"
      on:click={() => modalStore.trigger(roomModal)}>Create My Room</button
    >
  {/if}
</div>

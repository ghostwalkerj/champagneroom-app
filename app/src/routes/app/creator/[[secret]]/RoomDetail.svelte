<script lang="ts">
  import type { RoomDocumentType, roomZodSchema } from '$lib/models/room';
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms/client';

  export let room: RoomDocumentType;
  export let roomForm: SuperValidated<typeof roomZodSchema>;

  let form = superForm(roomForm);

  const modalStore = getModalStore();

  const roomModal: ModalSettings = {
    type: 'component',
    component: 'CreateRoomForm',
    title: 'Create Room',
    meta: {
      action: '?/create_room',
      form
    }
  };
</script>

<div class="card px-6 pb-6 bg-primary rounded-xl text-center">
  <header class="card-header text-primary-content font-bold text-2xl p-3">
    My Room
  </header>

  {#if room}
    {room.name}
  {:else}
    <div class="text-info">No room found</div>
    <button
      type="button"
      class="btn variant-filled-secondary mt-4"
      on:click={() => modalStore.trigger(roomModal)}>Create My Room</button
    >
  {/if}
</div>

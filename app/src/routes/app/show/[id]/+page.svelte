<script lang="ts">
  import type { ModalSettings } from '@skeletonlabs/skeleton';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';

  import { invalidate } from '$app/navigation';

  import type { ShowDocument } from '$lib/models/show';

  import config from '$lib/config';
  import { ShowStatus } from '$lib/constants';
  import getProfileImage from '$lib/profilePhoto';

  import NeonBlur from '$components/NeonBlur.svelte';
  import ShowDetail from '$components/ShowDetail.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  const modalStore = getModalStore();

  $: show = data.show as ShowDocument;
  let displayName = data.displayName;
  let isBuyingTicket = false;

  $: canBuyTicket =
    show.showState.status === ShowStatus.BOX_OFFICE_OPEN || isBuyingTicket;

  const modal: ModalSettings = {
    type: 'component',
    component: 'ReserveShowForm',
    meta: {
      action: '?/reserve_ticket',
      profileImage: getProfileImage(displayName, config.UI.profileImagePath),
      form: data.form
    }
  };

  onMount(() => {
    setInterval(() => {
      if (show.showState.isActive) invalidate('app:show');
    }, 5000);
  });
</script>

<!-- Page header -->
<div class="lg:max-w-4xl">
  {#key show.showState}
    <ShowDetail {show}>
      {#if canBuyTicket}
        <NeonBlur>
          <button
            on:click={() => modalStore.trigger(modal)}
            class="variant-filled btn btn-xl relative rounded-lg bg-white font-semibold"
            >Reserve Ticket</button
          >
        </NeonBlur>
      {/if}
    </ShowDetail>
  {/key}
</div>

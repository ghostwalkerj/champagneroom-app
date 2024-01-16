<script lang="ts">
  import Config from '$lib/models/config';
  import getProfileImage from '$lib/profilePhoto';

  import ShowDetail from '$components/ShowDetail.svelte';

  import NeonBlur from '$components/NeonBlur.svelte';
  import { ShowStatus } from '$lib/constants';
  import type { ModalSettings } from '@skeletonlabs/skeleton';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { PageData } from './$types';

  export let data: PageData;

  const modalStore = getModalStore();

  let show = data.show;
  let displayName = data.displayName;
  let isBuyingTicket = false;

  $: canBuyTicket =
    show.showState.status === ShowStatus.BOX_OFFICE_OPEN || isBuyingTicket;

  const modal: ModalSettings = {
    type: 'component',
    component: 'ReserveShowForm',
    meta: {
      action: '/app/show/' + data.show._id.toString() + '?/reserve_ticket',
      profileImage: getProfileImage(displayName, Config.UI.profileImagePath),
      form: data.form
    }
  };
</script>

<!-- Page header -->
<div class="lg:max-w-4xl">
  {#key show.showState}
    <ShowDetail {show}>
      {#if canBuyTicket}
        <NeonBlur>
          <button
            on:click={() => modalStore.trigger(modal)}
            class="btn btn-xl font-semibold rounded-lg bg-surface-700 variant-filled relative font-SpaceGrotesk"
            >Reserve Ticket</button
          >
        </NeonBlur>
      {/if}
    </ShowDetail>
  {/key}
</div>

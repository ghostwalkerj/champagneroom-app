<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import { onDestroy, onMount } from 'svelte';

  import { applyAction, deserialize, enhance } from '$app/forms';

  import Config from '$lib/config';
  import getProfileImage from '$lib/profilePhoto';

  import ShowDetail from '$components/ShowDetail.svelte';

  import type { PageData } from './$types';
  import NeonBlur from '$components/NeonBlur.svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { ModalSettings } from '@skeletonlabs/skeleton';
  import { ShowStatus } from '$lib/constants';

  export let data: PageData;

  const modalStore = getModalStore();

  let show = data.show;
  let displayName = data.displayName;
  let isBuyingTicket = false;
  //let showUnSub: Unsubscriber;

  $: isLoading = false;
  $: profileImage = getProfileImage(displayName, Config.UI.profileImagePath);
  $: canBuyTicket =
    show.showState.status === ShowStatus.BOX_OFFICE_OPEN || isBuyingTicket;
  const setPinAuth = async (userId: string, pin: string) => {
    const body = new FormData();
    body.append('pin', pin);
    body.append('userId', userId);
    const response = await fetch('?/pin_auth', {
      method: 'POST',
      body,
      redirect: 'follow'
    });

    const result: ActionResult = deserialize(await response.text());
    applyAction(result);
  };
  const onSubmit = () => {
    isBuyingTicket = true;
    isLoading = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        isLoading = false;
        isBuyingTicket = false;
      }
      await applyAction(result);
      if (result.type === 'success') {
        await setPinAuth(result.data.userId, result.data.pin);
      }
    };
  };
  onMount(() => {
    // showUnSub = notifyUpdate({
    //   id: show._id.toString(),
    //   type: 'Show',
    //   callback: () => {
    //     show = $page.data.show;
    //   }
    // });
  });

  onDestroy(() => {
    //showUnSub?.();
  });

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

<script lang="ts">
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import type { z } from 'zod';

  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import type { CreatorDocument } from '$lib/models/creator';
  import type { roomCRUDSchema } from '$lib/models/room';
  import type { ShowDocument } from '$lib/models/show';
  import type { ShowEventDocument } from '$lib/models/showEvent';
  import type { UserDocument } from '$lib/models/user';
  import type { WalletDocument } from '$lib/models/wallet';

  import type { requestPayoutSchema } from '$lib/payments';

  import ShowDetail from '$components/ShowDetail.svelte';
  import WalletDetail from '$components/WalletDetail.svelte';
  import {
    CreatorStore,
    ShowEventStore,
    ShowStore,
    WalletStore
  } from '$stores';

  import type { ShowPermissionsType } from './+page.server';
  import CancelShow from './CancelShow.svelte';
  import CreateShow from './CreateShow.svelte';
  import CreatorActivity from './CreatorActivity.svelte';
  import CreatorDetail from './CreatorDetail.svelte';
  import RoomDetail from './RoomDetail.svelte';
  import ShowStatus from './ShowStatus.svelte';
  import VideoMeeting from './VideoMeeting.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  let creator = data.creator as CreatorDocument;
  let currentShow = data.show as ShowDocument | undefined;
  let currentEvent = data.showEvent as ShowEventDocument | undefined;
  let completedShows = data.completedShows as ShowDocument[];
  let wallet = data.wallet as WalletDocument;
  let exchangeRate = +data.exchangeRate || 0;
  let jitsiToken = data.jitsiToken as string;
  let user = data.user as UserDocument;
  let sPermissions = data.showPermissions;
  let roomForm = data.roomForm as SuperValidated<
    z.infer<typeof roomCRUDSchema>
  >;
  let createShowForm = data.createShowForm;
  let payoutForm = data.payoutForm as SuperValidated<
    Infer<typeof requestPayoutSchema>
  >;

  $: showVideo = false;
  $: isLoading = false;

  let creatorUnSub: Unsubscriber;
  let showUnSub: Unsubscriber;
  let eventUnSub: Unsubscriber;
  let walletUnSub: Unsubscriber;

  const modalStore = getModalStore();

  const useNewShow = async (
    show: ShowDocument | undefined,
    showPermissions: ShowPermissionsType,
    event?: ShowEventDocument
  ) => {
    showUnSub?.();
    eventUnSub?.();
    sPermissions = showPermissions;
    currentShow = show;
    currentEvent = event;
    if (show && sPermissions.isActive) {
      showUnSub = ShowStore(show).subscribe((_show) => {
        if (_show) {
          currentShow = _show;
          eventUnSub?.();
          eventUnSub = ShowEventStore(_show).subscribe((_event) => {
            if (_event) currentEvent = _event;
          });
        }
      });
    }
  };

  onMount(() => {
    creatorUnSub = CreatorStore(creator).subscribe((value) => {
      creator = value;
    });
    walletUnSub = WalletStore(wallet).subscribe((value) => {
      wallet = value;
    });
    useNewShow(currentShow, sPermissions, currentEvent);
  });

  const unSubAll = () => {
    creatorUnSub?.();
    showUnSub?.();
    walletUnSub?.();
  };

  onDestroy(() => {
    unSubAll();
  });

  const startShow = async () => {
    isLoading = true;

    await invalidateAll();
    jitsiToken = $page.data.jitsiToken;
    let formData = new FormData();
    fetch('?/start_show', {
      method: 'POST',
      body: formData
    });
    showVideo = true;
    isLoading = false;
  };

  const leftShowCallback = () => {
    showVideo = false;
    let formData = new FormData();
    fetch('?/leave_show', {
      method: 'POST',
      body: formData
    });
  };

  // --------- Modal for Restarting or Ending Show
  const endShowModal: ModalSettings = {
    type: 'component',
    component: 'EndShowForm',
    meta: {
      isLoading,
      canStartShow: sPermissions.canStartShow
    },
    response: (r: boolean | undefined) => {
      console.log('response', r);
      if (!r) startShow();
    }
  };

  // Show Modal if showStopped is true
  $: if (sPermissions.showStopped) {
    modalStore.trigger(endShowModal);
  }
  // --------- End Modal for Restarting or Ending Show
</script>

{#if showVideo && currentShow && jitsiToken}
  <VideoMeeting
    {creator}
    {user}
    {currentShow}
    {leftShowCallback}
    bind:jitsiToken
  />
{:else}
  <div class="flex place-content-center">
    <div
      class="flex min-w-full max-w-7xl flex-col gap-3 p-4 md:grid md:min-w-min md:grid-cols-4"
    >
      <!-- 1st column -->
      <div class="flex-1 space-y-3 md:col-span-3 md:col-start-1">
        <!-- Status -->
        {#key currentShow}
          <ShowStatus
            canStartShow={sPermissions.canStartShow}
            bind:isLoading
            show={currentShow}
            onGoToShow={startShow}
            showEvent={currentEvent}
          />
        {/key}

        {#if sPermissions.canCreateShow}
          <CreateShow onShowCreated={useNewShow} {createShowForm} />
        {/if}
        <div>
          {#if sPermissions.isActive && currentShow}
            {#key currentShow.showState}
              <div class="">
                <ShowDetail
                  show={currentShow}
                  options={{
                    showCopy: true,
                    showSalesStats: true,
                    showRating: true,
                    showWaterMark: false
                  }}
                />
              </div>
            {/key}
          {/if}
        </div>

        {#if sPermissions.canCancelShow}
          <div class="lg:pb-4">
            <CancelShow onShowCancelled={useNewShow} bind:isLoading />
          </div>
        {/if}
      </div>

      <!--Next Column-->
      <div class="space-y-3 md:col-span-1 md:col-start-4">
        <!-- Photo -->
        <CreatorDetail bind:creator />

        <!-- Wallet -->
        <div>
          {#key wallet}
            <WalletDetail {wallet} {exchangeRate} {payoutForm} />
          {/key}
        </div>

        <!-- Room -->

        <RoomDetail {roomForm} />

        <!-- Activity Feed -->
        <div>
          <div class="lg:col-span-1 lg:col-start-3">
            <CreatorActivity {completedShows} />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import type { CreatorDocument } from '$lib/models/creator';
  import type { ShowDocument } from '$lib/models/show';
  import type { ShowEventDocument } from '$lib/models/showEvent';
  import type { WalletDocument } from '$lib/models/wallet';

  import type { ShowMachineServiceType } from '$lib/machines/showMachine';
  import { createShowMachineService } from '$lib/machines/showMachine';

  import {
    ActorType,
    CancelReason,
    ShowMachineEventString
  } from '$lib/constants';

  import ShowDetail from '$components/ShowDetail.svelte';
  import { CreatorStore, ShowStore, WalletStore } from '$stores';

  import WalletDetail from '$components/WalletDetail.svelte';
  import CancelShow from './CancelShow.svelte';
  import CreateShow from './CreateShow.svelte';
  import CreatorActivity from './CreatorActivity.svelte';
  import EndShow from './EndShow.svelte';
  import ShowStatus from './ShowStatus.svelte';

  import { page } from '$app/stores';
  import type { UserDocument } from '$lib/models/user';
  import type { Subscription } from 'xstate';
  import type { ActionData, PageData } from './$types';
  import CreatorDetail from './CreatorDetail.svelte';
  import VideoMeeting from './VideoMeeting.svelte';
  import RoomDetail from './RoomDetail.svelte';
  import type { RoomDocumentType, roomZodSchema } from '$lib/models/room';
  import type { SuperValidated } from 'sveltekit-superforms';
  export let data: PageData;
  export let form: ActionData;

  let creator = data.creator as CreatorDocument;
  let currentShow = data.show as ShowDocument | undefined;
  let currentEvent = data.showEvent as ShowEventDocument | undefined;
  let completedShows = data.completedShows as ShowDocument[];
  let wallet = data.wallet as WalletDocument;
  let exchangeRate = +data.exchangeRate || 0;
  let jitsiToken = data.jitsiToken as string;
  let user = data.user as UserDocument;
  let room = data.room as RoomDocumentType;
  let roomForm = data.roomForm as SuperValidated<typeof roomZodSchema>;

  $: showVideo = false;

  $: canCreateShow = false;
  $: canCancelShow = false;
  $: canStartShow = false;
  $: isLoading = false;
  $: showStopped = false;
  $: showCancelled = false;

  let creatorUnSub: Unsubscriber;
  let showUnSub: Unsubscriber;
  let walletUnSub: Unsubscriber;
  let showMachineService: ShowMachineServiceType;
  let showMachineServiceUnSub: Subscription;
  const destination = user.payoutAddress;

  const noCurrentShow = () => {
    showUnSub?.();
    showMachineService?.stop();
    canCreateShow = true;
    canCancelShow = false;
    canStartShow = false;
    currentShow = undefined;
    currentEvent = undefined;
    showStopped = false;
  };

  if (!currentShow) {
    noCurrentShow();
  }

  const useNewShow = (show: ShowDocument) => {
    if (show && show.showState.current) {
      currentShow = show;
      canCreateShow = false;

      showMachineService?.stop();
      showMachineService = createShowMachineService({
        showDocument: currentShow
      });
      useShowMachine(showMachineService);
      showUnSub?.();
      showUnSub = ShowStore(show).subscribe((_show) => {
        if (_show && _show.showState.current) {
          currentShow = _show;
          showMachineService?.stop();
          showMachineService = createShowMachineService({
            showDocument: _show
          });
          useShowMachine(showMachineService);
        } else {
          noCurrentShow();
        }
      });
    }
  };

  const useShowMachine = (showMachineService: ShowMachineServiceType) => {
    showMachineServiceUnSub?.unsubscribe();
    showMachineServiceUnSub = showMachineService.subscribe((state) => {
      if (state.changed) {
        showStopped = state.matches('stopped');
        showCancelled = state.matches('cancelled');
        if (showCancelled) {
          noCurrentShow();
        }
        canCancelShow = state.can({
          type: 'CANCELLATION INITIATED',
          cancel: {
            cancelledAt: new Date(),
            cancelledBy: ActorType.CREATOR,
            reason: CancelReason.CREATOR_CANCELLED
          }
        });
        canStartShow = state.can(ShowMachineEventString.SHOW_STARTED);
        if (state.done) {
          showMachineService.stop();
        }
      }
    });
  };

  onMount(() => {
    creatorUnSub = CreatorStore(creator).subscribe((value) => {
      creator = value;
    });
    currentShow ? useNewShow(currentShow) : noCurrentShow();
    walletUnSub = WalletStore(wallet).subscribe((value) => {
      wallet = value;
    });
  });

  const unSubAll = () => {
    creatorUnSub?.();
    showUnSub?.();
    walletUnSub?.();
  };

  onDestroy(() => {
    unSubAll();
    showMachineServiceUnSub?.unsubscribe();
    showMachineService?.stop();
  });

  const onShowCreated = (show: ShowDocument | undefined) => {
    showUnSub?.();
    if (!show) return;
    currentShow = show as ShowDocument;
    invalidateAll();
    currentEvent = $page.data.showEvent;
    useNewShow(currentShow);
  };

  const onShowCancelled = () => {
    noCurrentShow();
  };

  const startShow = async () => {
    await invalidateAll();
    jitsiToken = $page.data.jitsiToken;
    isLoading = true;
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

  const onShowEnded = () => {
    noCurrentShow();
  };
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
    <!-- Page header -->

    <!-- Modal for Restarting or Ending Show -->
    {#if showStopped}
      {#key currentShow && currentShow._id && canStartShow}
        <EndShow
          {onShowEnded}
          onGoToShow={startShow}
          bind:isLoading
          {canStartShow}
        />
      {/key}
    {/if}

    <div
      class="p-4 flex flex-col gap-3 min-w-full md:min-w-min max-w-7xl md:grid md:grid-cols-4"
    >
      <!-- 1st column -->
      <div class="flex-1 space-y-3 md:col-start-1 md:col-span-3">
        <!-- Status -->
        {#key currentShow && currentShow._id}
          <ShowStatus
            {canStartShow}
            bind:isLoading
            show={currentShow}
            onGoToShow={startShow}
            showEvent={currentEvent}
          />
        {/key}

        {#if canCreateShow}
          <CreateShow bind:isLoading {creator} {onShowCreated} {form} />
        {/if}
        <div>
          {#if currentShow}
            {#key currentShow.showState}
              <ShowDetail
                show={currentShow}
                options={{
                  showCopy: true,
                  showSalesStats: true,
                  showRating: true,
                  showWaterMark: false
                }}
              />
            {/key}
          {/if}
        </div>

        {#if canCancelShow}
          <div class="lg:pb-4">
            <CancelShow {onShowCancelled} bind:isLoading />
          </div>
        {/if}
      </div>

      <!--Next Column-->
      <div class="space-y-3 -mt-3 lg:mt-0 md:col-start-4 md:col-span-1">
        <!-- Photo -->
        <CreatorDetail bind:creator />

        <!-- Wallet -->
        <div>
          {#key wallet}
            <WalletDetail {wallet} {exchangeRate} {form} {destination} />
          {/key}
        </div>

        <!-- Room -->
        {#key room}
          <RoomDetail {room} {roomForm} />
        {/key}

        <!-- Activity Feed -->
        <div>
          <div class="lg:col-start-3 lg:col-span-1">
            <CreatorActivity {completedShows} />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

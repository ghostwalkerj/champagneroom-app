<script lang="ts">
  import { possessive } from 'i18n-possessive';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import StarRating from 'svelte-star-rating';
  import urlJoin from 'url-join';

  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { CancelReason } from '$lib/models/common';
  import type { CreatorDocumentType } from '$lib/models/creator';
  import type { ShowDocumentType } from '$lib/models/show';
  import type { ShowEventDocument } from '$lib/models/showEvent';
  import type { WalletDocumentType } from '$lib/models/wallet';

  import type { ShowMachineServiceType } from '$lib/machines/showMachine';
  import {
    createShowMachineService,
    ShowMachineEventString
  } from '$lib/machines/showMachine';

  import Config from '$lib/config';
  import { ActorType, durationFormatter } from '$lib/constants';

  import ProfilePhoto from '$components/ProfilePhoto.svelte';
  import ShowDetail from '$components/ShowDetail.svelte';
  import { CreatorStore, ShowStore, WalletStore } from '$stores';

  import CreatorActivity from './CreatorActivity.svelte';
  import CreatorWallet from './CreatorWallet.svelte';
  import ShowStatus from './ShowStatus.svelte';

  import type { ActionData, PageData } from './$types';
  export let data: PageData;
  export let form: ActionData;

  let creator = data.creator as CreatorDocumentType;
  let currentShow = data.show as ShowDocumentType | undefined;
  let currentEvent = data.showEvent as ShowEventDocument | undefined;
  let completedShows = data.completedShows as ShowDocumentType[];
  let wallet = data.wallet as WalletDocumentType;
  let exchangeRate = +data.exchangeRate || 0;

  const showTimePath = urlJoin($page.url.pathname, Config.Path.showTime);

  let showName = creator
    ? possessive(creator.user.name, 'en') + ' Show'
    : 'Show';

  $: showDuration = 60;
  $: creatorName = creator ? creator.user.name : 'Creator';

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
  const destination = creator.user.payoutAddress;

  const noCurrentShow = () => {
    showUnSub?.();
    showMachineService?.stop();
    canCreateShow = true;
    canCancelShow = false;
    canStartShow = false;
    currentShow = undefined;
    showStopped = false;
  };

  if (!currentShow) {
    noCurrentShow();
  }

  const useNewShow = (show: ShowDocumentType) => {
    if (show && show.showState.current) {
      showUnSub?.();
      currentShow = show;
      canCreateShow = false;

      showMachineService?.stop();
      showMachineService = createShowMachineService({
        showDocument: currentShow
      });
      useShowMachine(showMachineService);

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
    const state = showMachineService.getSnapshot();
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

  onDestroy(() => {
    creatorUnSub?.();
    showUnSub?.();
    walletUnSub?.();
  });

  const updateProfileImage = async (url: string) => {
    if (url && creator) {
      creator.profileImageUrl = url;
      let formData = new FormData();
      formData.append('url', url);
      await fetch('?/update_profile_image', {
        method: 'POST',
        body: formData
      });
    }
  };

  const onSubmit = ({}) => {
    isLoading = true;
    return async ({ result }) => {
      switch (true) {
        case result.data.showCreated: {
          const showUrl = urlJoin(
            window.location.origin,
            Config.Path.show,
            result.data.show!._id.toString()
          );
          navigator.clipboard.writeText(showUrl);
          currentShow = result.data.show as ShowDocumentType;
          useNewShow(currentShow);
          break;
        }
        case result.data.showCancelled:
        case result.data.inEscrow:
        case result.data.refundInitiated: {
          noCurrentShow();
          break;
        }
      }
      await applyAction(result);
      isLoading = false;
    };
  };
</script>

<div class="flex place-content-center">
  <!-- Page header -->

  <!-- Modal for Restarting or Ending Show -->
  {#if showStopped}
    <input type="checkbox" id="restart-show-modal" class="modal-toggle" />
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">You have Stopped the Show</h3>
        <p class="py-4">
          Are you sure you want to end the show? You will not be able to restart
          later. Ticket holders will be able to give feedback once the show is
          ended.
        </p>
        <div class="modal-action">
          <button
            class="btn"
            on:click={() => {
              isLoading = true;
              goto(showTimePath);
            }}
            disabled={!canStartShow || isLoading}>Restart Show</button
          >
          <form method="post" action="?/end_show" use:enhance={onSubmit}>
            <input type="hidden" name="showId" value={currentShow?._id} />
            <button class="btn" disabled={isLoading}>End Show</button>
          </form>
        </div>
      </div>
    </div>
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
          {isLoading}
          show={currentShow}
          {showTimePath}
          showEvent={currentEvent}
        />
      {/key}

      {#if canCreateShow}
        <div class="bg-primary text-primary-content card">
          <div class="text-center card-body items-center p-3">
            <h2 class="text-2xl card-title">Create a New Show</h2>
            <div class="flex flex-col w-full">
              <form method="post" action="?/create_show" use:enhance={onSubmit}>
                <div
                  class="flex flex-col md:flex-row text-white p-2 justify-center items-center gap-4"
                >
                  <div class="form-control flex-grow">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label class="label">
                      <span class="label-text">Title</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      class="input input-bordered input-primary"
                      bind:value={showName}
                      minlength="3"
                      maxlength="50"
                    />
                    {#if form?.badName}
                      <div class="shadow-lg alert alert-error">
                        Show Name should be between 3 and 50 characters
                      </div>
                    {/if}
                  </div>

                  <div class="form-control md:w-40">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label for="price" class="label">
                      <span class="label-text">Ticket Price in USD</span></label
                    >
                    <div class="rounded-md shadow-sm relative">
                      <div
                        class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
                      >
                        <span class="text-gray-500 sm:text-sm"> $ </span>
                      </div>
                      <input
                        type="text"
                        name="price"
                        class="w-full py-2 pl-6 input input-bordered input-primary"
                        placeholder="0.00"
                        aria-describedby="price-currency"
                        value={form?.price ?? ''}
                      />
                      <div
                        class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
                      >
                        <span
                          class="text-gray-500 sm:text-sm"
                          id="price-currency"
                        >
                          USD
                        </span>
                      </div>
                    </div>
                    {#if form?.missingPrice}<div
                        class="shadow-lg alert alert-error whitespace-nowrap"
                      >
                        Price is required
                      </div>{/if}
                    {#if form?.invalidPrice}<div
                        class="shadow-lg alert alert-error whitespace-nowrap"
                      >
                        Invalid Price
                      </div>{/if}
                  </div>

                  <input type="hidden" name="capacity" value="1" />

                  <input
                    type="hidden"
                    name="coverImageUrl"
                    value={creator.profileImageUrl}
                  />
                  <div class="form-control md:w-1/5">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label class="label">
                      <span class="label-text whitespace-nowrap"
                        >Duration ({durationFormatter(showDuration * 60)})</span
                      >
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      bind:value={showDuration}
                      class="range"
                      step="15"
                      name="duration"
                    />
                    <div class="w-full flex justify-between text-xs px-2">
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                    </div>
                  </div>
                </div>

                <div class="py-2">
                  <button
                    class="btn btn-secondary"
                    type="submit"
                    disabled={isLoading}>Create Show</button
                  >
                </div>
              </form>
            </div>
          </div>
        </div>
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
      <div class="pb-4">
        {#if canCancelShow}
          <!-- Cancel Form-->
          <form method="post" action="?/cancel_show" use:enhance={onSubmit}>
            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center p-3">
                <div class="text-2xl card-title">Cancel Your Show</div>
                <div class="text xl">
                  If you cancel this show any tickets sold will be refunded.
                </div>

                <div
                  class="flex flex-col text-white p-2 justify-center items-center"
                >
                  <div class="">
                    <button
                      class="btn btn-secondary"
                      type="submit"
                      disabled={isLoading}>Cancel Show</button
                    >
                  </div>
                </div>
              </div>
            </div>
          </form>
        {/if}
      </div>
    </div>

    <!--Next Column-->
    <div class="space-y-3 md:col-start-4 md:col-span-1">
      <!-- Photo -->
      <div>
        <div class="lg:col-start-3 lg:col-span-1">
          <div class="bg-primary text-primary-content card">
            <div class="text-center card-body items-center p-3">
              <h2 class="text-xl card-title">{creatorName}</h2>
              <div>
                <ProfilePhoto
                  profileImage={creator.profileImageUrl ||
                    Config.UI.defaultProfileImage}
                  callBack={(value) => {
                    updateProfileImage(value);
                  }}
                />
              </div>
              <div
                class="tooltip"
                data-tip={creator.feedbackStats.averageRating.toFixed(2)}
              >
                <StarRating rating={creator.feedbackStats.averageRating} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wallet -->
      <div>
        {#key wallet}
          <CreatorWallet {wallet} {exchangeRate} {form} {destination} />
        {/key}
      </div>

      <!-- Activity Feed -->
      <div>
        <div class="lg:col-start-3 lg:col-span-1">
          <CreatorActivity {completedShows} />
        </div>
      </div>
    </div>
  </div>
</div>

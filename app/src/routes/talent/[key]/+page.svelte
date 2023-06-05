<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ShowDetail from '$components/ShowDetail.svelte';
  import ProfilePhoto from '$components/forms/ProfilePhoto.svelte';
  import {
    PUBLIC_DEFAULT_PROFILE_IMAGE,
    PUBLIC_SHOWTIME_PATH,
    PUBLIC_SHOW_PATH,
  } from '$env/static/public';
  import { durationFormatter } from '$lib/constants';
  import type { ShowMachineServiceType } from '$lib/machines/showMachine';
  import {
    ShowMachineEventString,
    createShowMachineService,
  } from '$lib/machines/showMachine';
  import type { ShowDocumentType } from '$lib/models/show';
  import type { ShowEventDocumentType } from '$lib/models/showEvent';
  import type { TalentDocumentType } from '$lib/models/talent';
  import { showEventStore, showStore, talentStore } from '$stores';
  import { createEventText } from '$util/eventUtil';
  import { possessive } from 'i18n-possessive';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import urlJoin from 'url-join';
  import type { ActionData, PageData } from './$types';
  import TalentWallet from './TalentWallet.svelte';

  export let form: ActionData;
  export let data: PageData;

  const showTimePath = urlJoin($page.url.href, PUBLIC_SHOWTIME_PATH);

  let talent = data.talent as TalentDocumentType;
  let currentShow = data.currentShow as ShowDocumentType | undefined;

  let showName = talent ? possessive(talent.name, 'en') + ' Show' : 'Show';

  $: showDuration = 60;
  $: talentName = talent ? talent.name : 'Talent';
  $: statusText = currentShow
    ? currentShow.showState.status
    : 'No Current Show';
  $: eventText = 'No Events';

  $: canCreateShow = false;
  $: canCancelShow = false;
  $: canStartShow = false;
  $: waiting4Refunds = false;
  $: loading = false;
  $: showStopped = false;

  let talentUnSub: Unsubscriber;
  let showEventUnSub: Unsubscriber;
  let showUnSub: Unsubscriber;
  let showMachineService: ShowMachineServiceType;

  const noCurrentShow = () => {
    canCreateShow = true;
    canCancelShow = false;
    canStartShow = false;
    statusText = 'No Current Show';
    eventText = 'No Events';
    currentShow = undefined;
    showStopped = false;
    showEventUnSub?.();
    showUnSub?.();
  };

  const useNewShow = (show: ShowDocumentType) => {
    if (show && show.showState.current) {
      currentShow = show;
      canCreateShow = false;
      canCancelShow = true;
      statusText = show.showState.status;
      showEventUnSub?.();
      showUnSub?.();
      showUnSub = showStore(show).subscribe(_show => {
        if (_show && _show.showState.current) {
          currentShow = _show;
          showMachineService?.stop();
          showMachineService = createShowMachineService({
            showDocument: _show,
          });
          useShowMachine(showMachineService);
          showEventUnSub = showEventStore(show).subscribe(
            (_showEvent: ShowEventDocumentType) => {
              if (_showEvent) {
                eventText = createEventText(_showEvent);
              }
            }
          );
        } else {
          noCurrentShow();
        }
      });
    }
  };

  const useShowMachine = (showMachineService: ShowMachineServiceType) => {
    const state = showMachineService.getSnapshot();
    showStopped = state.matches('stopped');
    canCancelShow = state.can({
      type: 'CANCELLATION INITIATED',
      cancel: undefined,
    });
    canStartShow = state.can(ShowMachineEventString.SHOW_STARTED);
    waiting4Refunds = state.matches('initiatedCancellation.waiting2Refund');
    statusText = state.context.showState.status;
    if (state.done) {
      showMachineService.stop();
    }
  };

  onMount(() => {
    talentUnSub = talentStore(talent).subscribe(_talent => {
      if (_talent) {
        talent = _talent;
        talentName = _talent.name;
      }
    });
    currentShow ? useNewShow(currentShow) : noCurrentShow();
  });

  onDestroy(() => {
    talentUnSub?.();
    showEventUnSub?.();
    showUnSub?.();
  });

  const updateProfileImage = async (url: string) => {
    if (url && talent) {
      talent.profileImageUrl = url;
      let formData = new FormData();
      formData.append('url', url);
      await fetch('?/update_profile_image', {
        method: 'POST',
        body: formData,
      });
    }
  };

  const onSubmit = ({}) => {
    loading = true;
    return async ({ result }) => {
      if (result.data.showCreated) {
        const showUrl = urlJoin(
          window.location.origin,
          PUBLIC_SHOW_PATH,
          result.data.show!._id.toString()
        );
        navigator.clipboard.writeText(showUrl);
        currentShow = result.data.show as ShowDocumentType;
        useNewShow(currentShow);
      } else if (result.data.showCancelled) {
        noCurrentShow();
        statusText = 'Cancelled';
      } else if (result.data.inEscrow) {
        noCurrentShow();
        statusText = 'In Escrow';
      } else if (result.data.refundInitiated) {
        noCurrentShow();
        statusText = 'Refund Initiated';
      }
      await applyAction(result);
      loading = false;
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
            on:click={() => goto(showTimePath)}
            disabled={!canStartShow}>Restart Show</button
          >
          <form method="post" action="?/end_show" use:enhance={onSubmit}>
            <input type="hidden" name="showId" value={currentShow?._id} />
            <button class="btn">End Show</button>
          </form>
        </div>
      </div>
    </div>
  {/if}

  <div
    class="p-4 flex-col gap-3 min-w-full md:min-w-min max-w-7xl md:grid md:grid-cols-4"
  >
    <!-- 1st column -->
    <div class="flex-1 space-y-3 md:col-start-1 md:col-span-3">
      <!-- Status -->
      <div class="md:col-start-3 md:col-span-1">
        <div class="bg-primary text-primary-content card">
          <div class="text-center card-body -m-4 items-center">
            <div class="flex w-full flex-row justify-between gap-2">
              <div class="grow">
                <div class="alert alert-info shadow-lg p-3">
                  <div>
                    <iconify-icon icon="mingcute:information-line" />
                    <p class="capitalize">{statusText.toLowerCase()}</p>
                  </div>
                </div>
              </div>
              <div class="grow">
                <div class="alert alert-info shadow-lg p-3">
                  <div>
                    <iconify-icon icon="mingcute:information-line" />

                    <p class="capitalize">{eventText}</p>
                  </div>
                </div>
              </div>
              {#if canStartShow}
                <button
                  class="btn"
                  type="submit"
                  on:click={() => goto(showTimePath)}>Start Show</button
                >
              {/if}
            </div>
          </div>
        </div>
      </div>
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
                  </div>
                  {#if form?.badName}
                    <div class="shadow-lg alert alert-error">
                      Show Name should be between 3 and 50 characters
                    </div>
                  {/if}

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
                          USDC
                        </span>
                      </div>
                    </div>
                    {#if form?.missingPrice}<div
                        class="shadow-lg alert alert-error"
                      >
                        Price is required
                      </div>{/if}
                    {#if form?.invalidPrice}<div
                        class="shadow-lg alert alert-error"
                      >
                        Invalid Price
                      </div>{/if}
                  </div>

                  <input type="hidden" name="capacity" value="1" />

                  <input
                    type="hidden"
                    name="coverImageUrl"
                    value={talent.profileImageUrl}
                  />
                  <div class="form-control md:w-1/5">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label class="label">
                      <span class="label-text"
                        >Duration ({durationFormatter(showDuration)})</span
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
                    disabled={loading}>Create Show</button
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
                showRating: false,
                showWaterMark: false,
              }}
            />
          {/key}
        {/if}
      </div>
      <div class="pb-4">
        {#if canCancelShow}
          <!-- Link Form-->
          <form method="post" action="?/cancel_show" use:enhance={onSubmit}>
            <input type="hidden" name="showId" value={currentShow?._id} />
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
                      disabled={loading}>Cancel Show</button
                    >
                  </div>
                </div>
              </div>
            </div>
          </form>
        {/if}
        {#if waiting4Refunds}
          <!-- Link Form-->
          <form method="post" action="?/refund_tickets" use:enhance={onSubmit}>
            <input type="hidden" name="showId" value={currentShow?._id} />

            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center p-3">
                <div class="text-2xl card-title">Send Refunds</div>

                <div
                  class="flex flex-col text-white p-2 justify-center items-center"
                >
                  <div class="">
                    <button
                      class="btn btn-secondary"
                      type="submit"
                      disabled={loading}>Send Refunds</button
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
              <h2 class="text-xl card-title">{talentName}</h2>
              <div>
                <ProfilePhoto
                  profileImage={talent.profileImageUrl ||
                    PUBLIC_DEFAULT_PROFILE_IMAGE}
                  callBack={value => {
                    updateProfileImage(value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wallet -->
      <div>
        <TalentWallet />
      </div>

      <!-- Feedback -->
      <div>
        <div class="lg:col-start-3 lg:col-span-1">
          <div class="bg-primary text-primary-content card">
            <!-- <div class="text-center card-body items-center p-3">
              <h2 class="text-2xl card-title">Your Average Rating</h2>
              {talent.stats.ratingAvg.toFixed(2)}
              <StarRating rating={talent.stats.ratingAvg ?? 0} />
            </div> -->
          </div>
        </div>
      </div>

      <!-- Activity Feed -->
      <div>
        <div class="lg:col-start-3 lg:col-span-1" />
      </div>
    </div>
  </div>
</div>

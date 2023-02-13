<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';
  import ProfilePhoto from '$lib/components/forms/ProfilePhoto.svelte';
  import { createShowMachineService } from '$lib/machines/showMachine';
  import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
  import { ShowStatus, type ShowDocument } from '$lib/ORM/models/show';
  import type { TalentDocType } from '$lib/ORM/models/talent';
  import { durationFormatter } from '$lib/util/constants';
  import { possessive } from 'i18n-possessive';
  import StarRating from 'svelte-star-rating';

  import { goto } from '$app/navigation';
  import ShowDetail from '$lib/components/ShowDetail.svelte';
  import { ShowEventType } from '$lib/ORM/models/showevent';
  import * as timeago from 'timeago.js';
  import urlJoin from 'url-join';
  import type { Subscription } from 'xstate';
  import type { PageData } from './$types';
  import TalentWallet from './TalentWallet.svelte';
  import { onMount } from 'svelte';

  export let form: import('./$types').ActionData;
  export let data: PageData;

  const token = data.token;
  let talent = data.talent as TalentDocType;
  $: currentShow = data.currentShow as ShowDocument | null;

  let showName = possessive(talent.name, 'en') + ' Show';
  $: showDuration = 60;
  let key = $page.params.key;
  let showMachineService =
    currentShow &&
    createShowMachineService({
      showState: currentShow.showState,
    });
  let showSub: Subscription;
  const showPath = urlJoin($page.url.href, 'show');

  let showMachineState =
    currentShow && showMachineService && showMachineService.getSnapshot();

  $: canCancelShow =
    currentShow &&
    (currentShow.showState.status === ShowStatus.BOX_OFFICE_CLOSED ||
      currentShow.showState.status === ShowStatus.BOX_OFFICE_OPEN);

  $: canCreateShow =
    !currentShow ||
    showMachineState?.done ||
    currentShow.showState.status === ShowStatus.ENDED ||
    currentShow.showState.status === ShowStatus.CANCELLED;

  $: waiting4StateChange = false;
  $: canStartShow = false;
  $: statusText = currentShow?.showState.status ?? 'No Current Show';
  $: eventText = 'No Events';
  $: active = currentShow?.showState.active ?? false;

  const useShowState = (showState: ShowDocument['showState']) => {
    if (showMachineService) showMachineService.stop();
    if (showSub) showSub.unsubscribe();
    active = showState.active;
    showMachineService = createShowMachineService({
      showState: showState,
    });
    showSub = showMachineService.subscribe(state => {
      if (state.changed) {
        showMachineState = state;
        canCancelShow = state.can({
          type: 'REQUEST CANCELLATION',
          cancel: undefined,
        });
        canCreateShow = state.done ?? true;
        canStartShow = state.can({
          type: 'START SHOW',
        });
      }
    });
  };

  const useShow = (show: ShowDocument) => {
    show
      .get$('showState')
      .subscribe((_showState: ShowDocument['showState']) => {
        waiting4StateChange = false;
        if (_showState) {
          useShowState(_showState);
          statusText = _showState.status;
        }
      });
  };

  const updateProfileImage = async (url: string) => {
    if (url && talent) {
      let formData = new FormData();
      formData.append('url', url);
      fetch('?/update_profile_image', {
        method: 'POST',
        body: formData,
      });
    }
  };

  talentDB(key, token).then((db: TalentDBType | undefined) => {
    if (!db) return;
    db.talents
      .findOne(talent._id)
      .exec()
      .then(_talent => {
        if (_talent) {
          talent = _talent;
          _talent.get$('currentShow').subscribe(async showId => {
            eventText = 'No Events';
            if (showId) {
              canStartShow = false;
              db.shows.findOne(showId).$.subscribe(async _currentShow => {
                if (_currentShow) {
                  currentShow = _currentShow;
                  if (currentShow.showState.active) {
                    useShow(_currentShow);
                    db.showevents
                      .findOne()
                      .where('show')
                      .eq(_currentShow._id)
                      .sort({ createdAt: 'desc' })
                      .$.subscribe(async event => {
                        if (event) {
                          eventText =
                            timeago.format(event.createdAt) +
                            ' ' +
                            event.ticketInfo?.name;
                          switch (event.type) {
                            case ShowEventType.TICKET_SOLD:
                              eventText += ' bought a ticket!';
                              break;

                            case ShowEventType.TICKET_RESERVED:
                              eventText += ' reserved a ticket!';
                              break;

                            case ShowEventType.TICKET_CANCELLED:
                              eventText += ' cancelled';
                              break;

                            default:
                              eventText = 'No Events';
                          }
                        }
                      });
                  }
                }
              });
            } else {
              currentShow = null;
              eventText = 'No Events';
              statusText = 'No Current Show';
            }
          });
        }
      });
  });

  const onSubmit = ({}) => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type !== 'success') {
        waiting4StateChange = false;
      }
      await applyAction(result);
    };
  };
</script>

<div class="h-full w-full flex place-content-center">
  <!-- Page header -->

  <div class="p-4 grid gap-3 min-w-full md:min-w-min max-w-7xl md:grid-cols-4">
    <!-- 1st column -->
    <div class="space-y-3 md:col-start-1 md:col-span-3">
      <!-- Status -->
      <div class="md:col-start-3 md:col-span-1">
        <div class="bg-primary text-primary-content card">
          <div class="text-center card-body -m-4 items-center">
            <div class="flex w-full flex-row justify-between gap-2">
              <div class="grow">
                <div class="alert alert-info shadow-lg p-3">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      class="stroke-current flex-shrink-0 w-6 h-6"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      /></svg
                    >
                    <p class="capitalize">{statusText.toLowerCase()}</p>
                  </div>
                </div>
              </div>
              <div class="grow">
                <div class="alert alert-info shadow-lg p-3">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      class="stroke-current flex-shrink-0 w-6 h-6"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      /></svg
                    >
                    <span>{eventText}</span>
                  </div>
                </div>
              </div>
              {#if canStartShow}
                <button
                  class="btn"
                  type="submit"
                  on:click={() => goto(showPath)}>Start Show</button
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
                  class="flex flex-col md:flex-row  text-white p-2 justify-center items-center gap-4"
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
                        class="w-full py-2 pl-6 input input-bordered input-primary "
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

                  <input type="hidden" name="maxNumTickets" value="1" />
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
                    disabled={waiting4StateChange}>Create Show</button
                  >
                </div>
              </form>
            </div>
          </div>
        </div>
      {/if}
      {#if active}
        {#key showMachineState || currentShow}
          <div class="h-full">
            <ShowDetail
              show={currentShow}
              options={{
                showCopy: true,
                showSalesStats: true,
                showRating: false,
                showWaterMark: false,
              }}
            />
          </div>
        {/key}
      {/if}

      {#if canCancelShow}
        <!-- Link Form-->
        <form method="post" action="?/cancel_show" use:enhance={onSubmit}>
          <div class="bg-primary text-primary-content card ">
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
                    disabled={waiting4StateChange}>Cancel Show</button
                  >
                </div>
              </div>
            </div>
          </div>
        </form>
      {/if}
    </div>

    <!--Next Column-->
    <div class="space-y-3 md:col-start-4 md:col-span-1">
      <!-- Photo -->
      <div>
        <div class="lg:col-start-3 lg:col-span-1">
          <div class="bg-primary text-primary-content card">
            <div class="text-center card-body items-center  p-3">
              <h2 class="text-xl card-title">{talent.name}</h2>
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
        <TalentWallet {talent} />
      </div>

      <!-- Feedback -->
      <div>
        <div class="lg:col-start-3 lg:col-span-1">
          <div class="bg-primary text-primary-content card">
            <div class="text-center card-body items-center  p-3">
              <h2 class="text-2xl card-title">Your Average Rating</h2>
              {talent.stats.ratingAvg.toFixed(2)}
              <StarRating rating={talent.stats.ratingAvg ?? 0} />
            </div>
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

<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';
  import ProfilePhoto from '$lib/components/forms/ProfilePhoto.svelte';
  import {
    createShowMachineService,
    type ShowMachineServiceType,
  } from '$lib/machines/showMachine';
  import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
  import { ShowStatus, type ShowDocument } from '$lib/ORM/models/show';
  import type { TalentDocType, TalentDocument } from '$lib/ORM/models/talent';
  import { durationFormatter } from '$lib/util/constants';
  import { possessive } from 'i18n-possessive';
  import { onMount } from 'svelte';
  import StarRating from 'svelte-star-rating';

  import ShowDetail from '$lib/components/ShowDetail.svelte';
  import type { Subscription } from 'xstate';
  import type { PageData } from './$types';
  import TalentWallet from './TalentWallet.svelte';
  import { ShowEventType } from '$lib/ORM/models/showEvent';
  import spacetime from 'spacetime';

  export let form: import('./$types').ActionData;
  export let data: PageData;

  const token = data.token;
  let talentObj = data.talent as TalentDocType;
  $: currentShow = data.currentShow as ShowDocument | null;

  let showName = possessive(talentObj.name, 'en') + ' Show';
  $: showDuration = 60;
  let key = $page.params.key;
  let talent: TalentDocument;
  let showMachineService: ShowMachineServiceType;
  let showSub: Subscription;

  let showMachineState =
    currentShow &&
    createShowMachineService({
      showState: currentShow.showState,
    }).getSnapshot();

  $: canCancelShow =
    showMachineState &&
    showMachineState.can({
      type: 'REQUEST CANCELLATION',
      cancel: undefined,
    });

  $: canCreateShow =
    !currentShow ||
    currentShow.showState.status === ShowStatus.CANCELLED ||
    currentShow.showState.status === ShowStatus.FINALIZED ||
    currentShow.showState.status === ShowStatus.ENDED;

  $: waiting4StateChange = false;
  $: soldOut = false;
  $: canStartShow = false;
  $: statusText = 'No Current Show';
  $: eventText = 'No Events';

  const useShowState = (
    show: ShowDocument,
    showState: ShowDocument['showState']
  ) => {
    if (showMachineService) showMachineService.stop();
    if (showSub) showSub.unsubscribe();

    showMachineService = createShowMachineService({
      showState: showState,
      saveShowStateCallback: show.saveShowStateCallback,
    });
    showSub = showMachineService.subscribe(state => {
      if (state.changed) {
        showMachineState = state;

        if (state.changed) {
          canCancelShow = state.can({
            type: 'REQUEST CANCELLATION',
            cancel: undefined,
          });
          canCreateShow = state.done ?? true;
          canStartShow =
            show.showState.ticketsSold > 0 &&
            state.can({
              type: 'START SHOW',
            });
        }
      }
    });
  };

  const useShow = (show: ShowDocument) => {
    show
      .get$('showState')
      .subscribe((_showState: ShowDocument['showState']) => {
        waiting4StateChange = false;
        useShowState(show, _showState);
        switch (_showState.status) {
          case ShowStatus.CANCELLED:
            statusText = 'Cancelled';
            break;
          case ShowStatus.CANCELLATION_REQUESTED:
            statusText = 'Cancellation Requested';
            break;
          case ShowStatus.BOX_OFFICE_CLOSED:
            statusText = 'Sold Out';
            break;
          case ShowStatus.BOX_OFFICE_OPEN:
            statusText = 'Box Office Open';
            break;
          case ShowStatus.STARTED:
            statusText = 'Show Started';
            break;
          case ShowStatus.FINALIZED:
          case ShowStatus.ENDED:
          case ShowStatus.IN_ESCROW:
          case ShowStatus.IN_DISPUTE:
            statusText = 'Ended';
            break;

          default:
        }

        soldOut =
          _showState.ticketsSold - _showState.ticketsRefunded ===
          show.maxNumTickets;
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

  onMount(async () => {
    talentDB(key, token).then((db: TalentDBType | undefined) => {
      if (!db) return;
      db.talents
        .findOne(talentObj._id)
        .exec()
        .then(_talent => {
          if (_talent) {
            talentObj = _talent;
            talent = _talent;
            talent.get$('currentShow').subscribe(async showId => {
              if (showId) {
                soldOut = false;
                canStartShow = false;
                currentShow = await db.shows.findOne(showId).exec();
                if (currentShow) {
                  useShow(currentShow);

                  db.showEvents
                    .findOne()
                    .where('show')
                    .eq(currentShow._id)
                    .sort({ createdAt: 'desc' })
                    .$.subscribe(async event => {
                      if (event) {
                        eventText =
                          spacetime(event.createdAt).format('nice-short') +
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
              } else {
                currentShow = null;
              }
            });
          }
        });
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

<div class="min-h-full">
  <main class="py-10">
    <!-- Page header -->
    <div
      class="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
    >
      <div class="flex space-x-5 items-center">
        <div>
          <h1 class="font-bold text-5xl">Manage Show</h1>
        </div>
      </div>
    </div>
    <div
      class="mx-auto mt-8 max-w-3xl grid gap-6 grid-cols-1 sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3"
    >
      <div class="space-y-6 lg:col-start-1 lg:col-span-2">
        <!-- Status -->
        <div class="lg:col-start-3 lg:col-span-1">
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
                      <span>{statusText}</span>
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
                  <form
                    method="post"
                    action="?/start_show"
                    use:enhance={onSubmit}
                  >
                    <button class="btn" type="submit">Start Show</button>
                  </form>
                {/if}
              </div>
            </div>
          </div>
        </div>
        {#if canCreateShow}
          <div class="bg-primary text-primary-content card">
            <div class="text-center card-body items-center">
              <h2 class="text-2xl card-title">Create a New Show</h2>
              <div
                class="flex flex-col text-white p-2 justify-center items-center"
              >
                <form
                  method="post"
                  action="?/create_show"
                  use:enhance={onSubmit}
                >
                  <div class="max-w-xs  py-2 form-control">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label class="label">
                      <span class="label-text">Title</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      class="max-w-xs  py-2 input input-bordered input-primary"
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

                  <div class="max-w-xs w-full py-2 form-control ">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label for="price" class="label">
                      <span class="label-text">Ticket Price in USD</span></label
                    >
                    <div class="rounded-md shadow-sm mt-1 relative">
                      <div
                        class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
                      >
                        <span class="text-gray-500 sm:text-sm"> $ </span>
                      </div>
                      <input
                        type="text"
                        name="price"
                        class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
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
                  <div class="max-w-xs  py-2 form-control">
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

                  <div class="py-4">
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
        {#key showMachineState || currentShow}
          <div class=" ">
            <ShowDetail show={currentShow} showCopy showSalesStats />
          </div>
        {/key}
        {#if canCancelShow}
          <!-- Link Form-->
          <form method="post" action="?/cancel_show" use:enhance={onSubmit}>
            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center">
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
      <div class="space-y-6 lg:col-start-3 lg:col-span-1">
        <!-- Photo -->
        <div>
          <div class="lg:col-start-3 lg:col-span-1">
            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center">
                <h2 class="text-3xl card-title">{talentObj.name}</h2>
                <div>
                  <ProfilePhoto
                    profileImage={talentObj.profileImageUrl ||
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
              <div class="text-center card-body items-center">
                <h2 class="text-2xl card-title">Your Average Rating</h2>
                {talentObj.stats.ratingAvg.toFixed(2)}
                <StarRating rating={talentObj.stats.ratingAvg ?? 0} />
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
  </main>
</div>

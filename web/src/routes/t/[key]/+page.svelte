<script lang="ts">
  import { browser } from '$app/environment';
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';
  import ProfilePhoto from '$lib/components/forms/ProfilePhoto.svelte';
  import {
    createShowMachineService,
    type ShowMachineServiceType,
  } from '$lib/machines/showMachine';
  import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
  import type { ShowDocType, ShowDocument } from '$lib/ORM/models/show';
  import type { TalentDocType, TalentDocument } from '$lib/ORM/models/talent';
  import { currencyFormatter } from '$lib/util/constants';
  import type { VideoCallType } from '$lib/util/videoCall';
  import { onMount } from 'svelte';
  import StarRating from 'svelte-star-rating';
  import type { Subscription } from 'xstate';
  import type { PageData } from './$types';
  import TalentWallet from './TalentWallet.svelte';

  export let form: import('./$types').ActionData;

  export let data: PageData;
  const token = data.token;

  let talentObj = data.talent as TalentDocType;
  let completedShows = data.completedShows as ShowDocType[];
  $: currentShow = data.currentShow as ShowDocument;
  let key = $page.params.key;
  let vc: VideoCallType;
  let talent: TalentDocument;
  let showMachineService: ShowMachineServiceType;
  let showSub: Subscription;

  $: ready4Call = false;
  $: inCall = false;
  let showMachineState =
    currentShow &&
    createShowMachineService(currentShow.showState).getSnapshot();

  $: canCancelShow =
    showMachineState &&
    showMachineState.can({
      type: 'REQUEST CANCELLATION',
    });

  $: canCreateShow =
    !currentShow ||
    (showMachineState && showMachineState.done) ||
    (showMachineState && showMachineState.matches('inEscrow'));

  $: waiting4StateChange = false;

  const useShowState = (
    show: ShowDocument,
    showState: ShowDocument['showState']
  ) => {
    if (showMachineService) showMachineService.stop();
    if (showSub) showSub.unsubscribe();

    showMachineService = createShowMachineService(
      showState,
      show.saveShowStateCallBack
    );
    showSub = showMachineService.subscribe(state => {
      showMachineState = state;

      if (state.changed) {
        canCancelShow = state.can({
          type: 'REQUEST CANCELLATION',
        });
        canCreateShow = state.done ?? true;
      }
    });
  };

  const useShow = (show: ShowDocument) => {
    currentShow = show;
    waiting4StateChange = false; // link changed, so can submit again
    useShowState(show, show.showState);
    show.get$('showState').subscribe(_showState => {
      waiting4StateChange = false; // link changed, so can submit again
      useShowState(show, _showState);
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

  onMount(async () => {});

  const onSubmit = ({ form }) => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type !== 'success') {
        waiting4StateChange = false;
      } else {
        if (form) form.reset();
      }
      await applyAction(result);
    };
  };

  if (browser) {
    talentDB(token, key).then((db: TalentDBType) => {
      db.talents
        .findOne(talentObj._id)
        .exec()
        .then(_talent => {
          if (_talent) {
            talentObj = _talent;
            talent = _talent;
            talent.get$('currentShow').subscribe(showId => {
              // if (linkId) {
              //   db.links
              //     .findOne(linkId)
              //     .exec()
              //     .then(link => {
              //       if (link) useLink(link);
              //     });
              // }
            });
          }
        });
    });
  }
</script>

<div class="min-h-full">
  <main class="py-10">
    <!-- Page header -->
    <div
      class="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
    >
      <div class="flex space-x-5 items-center">
        <div>
          <h1 class="font-bold text-5xl">Request a pCall</h1>
          <p class="pt-6">
            Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam.
            Posuit eam ad opus nunc et adepto a pCall!
          </p>
        </div>
      </div>
    </div>
    {#if !inCall}
      <div
        class="mx-auto mt-8 max-w-3xl grid gap-6 grid-cols-1 sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3"
      >
        <div class="space-y-6 lg:col-start-1 lg:col-span-2">
          <div />
          {#if canCancelShow}
            <!-- Link Form-->
            <form method="post" action="?/cancel_link" use:enhance={onSubmit}>
              <div class="bg-primary text-primary-content card">
                <div class="text-center card-body items-center">
                  <div class="text-2xl card-title">Cancel Your pCall Link</div>
                  <div class="text xl">
                    If you cancel this pCall link, the link will be deactivated
                    and nobody can use it to call.
                  </div>
                  {#if showMachineState.context.showState.totalSales > 0}
                    {currencyFormatter.format(
                      showMachineState.context.showState.totalSales
                    )} will be refunded"
                  {/if}

                  <div
                    class="flex flex-col text-white p-2 justify-center items-center"
                  >
                    <div class="py-4">
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled={waiting4StateChange}>Cancel Link</button
                      >
                    </div>
                  </div>
                </div>
              </div>
            </form>
          {:else if canCreateShow}
            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center">
                <h2 class="text-2xl card-title">Create a New pCall Link</h2>
                <div
                  class="flex flex-col text-white p-2 justify-center items-center"
                >
                  <form
                    method="post"
                    action="?/create_link"
                    use:enhance={onSubmit}
                  >
                    <div class="max-w-xs w-full py-2 form-control ">
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <label for="price" class="label">
                        <span class="label-text">Requested Amount in USD</span
                        ></label
                      >
                      <div class="rounded-md shadow-sm mt-1 relative">
                        <div
                          class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
                        >
                          <span class="text-gray-500 sm:text-sm"> $ </span>
                        </div>
                        <input
                          type="text"
                          name="amount"
                          class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
                          placeholder="0.00"
                          aria-describedby="price-currency"
                          value={form?.amount ?? ''}
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
                      {#if form?.missingAmount}<div
                          class="shadow-lg alert alert-error"
                        >
                          Amount is required
                        </div>{/if}
                      {#if form?.invalidAmount}<div
                          class="shadow-lg alert alert-error"
                        >
                          Invalid Amount
                        </div>{/if}
                    </div>

                    <div class="py-4">
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled={waiting4StateChange}>Generate Link</button
                      >
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center">
                <h2 class="text-2xl card-title">
                  Issue Refund for Cancelled Link
                </h2>
                <div
                  class="flex flex-col text-white p-2 justify-center items-center"
                >
                  <form
                    method="post"
                    action="?/send_refund"
                    use:enhance={onSubmit}
                  >
                    <div class="max-w-xs w-full py-2 form-control ">
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <label for="price" class="label">
                        <span class="label-text">Refund </span></label
                      >
                      <div class="rounded-md shadow-sm mt-1 relative">
                        <div
                          class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
                        >
                          <span class="text-gray-500 sm:text-sm"> $ </span>
                        </div>
                        <input
                          type="text"
                          name="amount"
                          class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
                          placeholder="0.00"
                          aria-describedby="price-currency"
                          value={form?.amount ?? ''}
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
                      {#if form?.missingAmount}<div
                          class="shadow-lg alert alert-error"
                        >
                          Amount is required
                        </div>{/if}
                      {#if form?.invalidAmount}<div
                          class="shadow-lg alert alert-error"
                        >
                          Invalid Amount
                        </div>{/if}
                    </div>

                    <div class="py-4">
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled={waiting4StateChange}>Send Refund</button
                      >
                    </div>
                  </form>
                </div>
              </div>
            </div>
          {/if}

          <!-- Camera  Preview -->
          <div class="bg-primary text-primary-content card">
            <div class="text-center card-body items-center">
              <h2 class="text-2xl card-title">Your Video Preview</h2>
              <div class="rounded-2xl" />
            </div>
          </div>
        </div>

        <!--Next Column-->
        <div class="space-y-6 lg:col-start-3 lg:col-span-1">
          <!-- Status -->
          <div class="lg:col-start-3 lg:col-span-1">
            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center">
                <h2 class="text-2xl card-title">Call Status</h2>
                {#if ready4Call}
                  <div class="text-2xl">Waiting for Incoming Call</div>
                {:else}
                  <p>Signed in as {talentObj.name}</p>
                {/if}
              </div>
            </div>
          </div>
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
    {/if}
  </main>
</div>

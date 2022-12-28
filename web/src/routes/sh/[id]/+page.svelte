<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';

  import {
    publicShowDB,
    type PublicShowDBType,
  } from '$lib/ORM/dbs/publicShowDB';
  import { type ShowDocument, ShowStatus } from '$lib/ORM/models/show';
  import { StorageTypes } from '$lib/ORM/rxdb';
  import getProfileImage from '$lib/util/profilePhoto';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import ShowDetail from './ShowDetail.svelte';

  export let form: import('./$types').ActionData;
  export let data: PageData;

  const token = data.token;
  let show = data.show;
  let displayName = data.displayName;
  let showId = $page.params.id;

  $: waiting4StateChange = false;
  $: profileImage = getProfileImage(displayName);
  $: canBuyTicket = show.showState.status === ShowStatus.BOX_OFFICE_OPEN;

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

  // Wait for onMount to grab user Stream only if we plan to call or do we grab to to make sure it works?
  onMount(async () => {
    publicShowDB(token, showId, StorageTypes.IDB).then(
      (db: PublicShowDBType) => {
        db.shows.findOne(showId).$.subscribe(_show => {
          if (_show) {
            _show.$.subscribe(_show => {
              if (_show) {
                // Here is where we run the machine and do all the logic based on the state
                // const showService = createShowMachineService(_show.showState);
                // showService.onTransition(state => {
                //   if (state.changed) {
                //     canBuyTicket = state.matches('boxOfficeOpen');
                //   }
                // });
                show = _show as ShowDocument;
                waiting4StateChange = false;
              }
            });
          }
        });
      }
    );
  });
</script>

<div class="mt-6 flex flex-col h-[calc(100vh-120px)] items-center">
  <div class="min-w-full">
    <!-- Page header -->
    {#key show}
      <div class="pb-4">
        <ShowDetail {show} />
      </div>
    {/key}
    {#if canBuyTicket}
      <div class="flex justify-center place-content-center">
        <div class="gap-4 rounded-xl bg-base-200 flex flex-col items-center">
          <div
            class="bg-cover  bg-no-repeat rounded-full h-48 w-48"
            style="background-image: url('{profileImage}')"
          />
          <form method="post" action="?/buy_ticket" use:enhance={onSubmit}>
            <div class="max-w-xs w-full py-2 form-control ">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label for="caller" class="label">
                <span class="label-text">Your Display Name</span></label
              >
              <div class="rounded-md shadow-sm mt-1 relative">
                <input
                  name="name"
                  type="text"
                  class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
                  bind:value={displayName}
                />
                {#if form?.missingName}<div class="shadow-lg alert alert-error">
                    Name is required
                  </div>{/if}
              </div>
            </div>
            <div class="max-w-xs w-full py-2 form-control ">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label for="pin" class="label">
                <span class="label-text">8 Digit Pin</span></label
              >
              <div class="rounded-md shadow-sm mt-1 relative">
                <input
                  name="pin"
                  type="text"
                  class="max-w-xs w-full py-2 pl-6 input input-bordered input-primary"
                  value={form?.pin ?? ''}
                  minlength="8"
                  maxlength="8"
                />
                {#if form?.missingPin}<div class="shadow-lg alert alert-error">
                    Pin is required
                  </div>{/if}
                {#if form?.invalidPin}<div class="shadow-lg alert alert-error">
                    Pin must be 8 digits
                  </div>{/if}
              </div>
            </div>

            <div class="py-4 text-center">
              <button
                class="btn btn-secondary "
                type="submit"
                disabled={waiting4StateChange}>Buy a Ticket</button
              >
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
</div>

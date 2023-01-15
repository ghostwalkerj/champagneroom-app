<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';

  import {
    publicShowDB,
    type PublicShowDBType,
  } from '$lib/ORM/dbs/publicShowDB';
  import { ShowStatus, type ShowDocument } from '$lib/ORM/models/show';
  import { StorageTypes } from '$lib/ORM/rxdb';
  import getProfileImage from '$lib/util/profilePhoto';
  import { onMount } from 'svelte';
  import type { ActionData, PageData } from './$types';
  import ShowDetail from './ShowDetail.svelte';

  export let data: PageData;
  export let form: ActionData;
  const token = data.token;
  let show = data.show;
  let displayName = data.displayName;
  let showId = $page.params.id;

  $: waiting4StateChange = false;
  $: profileImage = getProfileImage(displayName);
  $: canBuyTicket = show.showState.status === ShowStatus.BOX_OFFICE_OPEN;

  const onSubmit = () => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        waiting4StateChange = false;
      }
      await applyAction(result);
    };
  };

  onMount(async () => {
    publicShowDB(token, showId, StorageTypes.IDB).then(
      (db: PublicShowDBType) => {
        db.shows.findOne(showId).$.subscribe(_show => {
          show = _show as ShowDocument;
        });
      }
    );
  });
</script>

<div class="mt-6 flex items-center">
  <div class="min-w-full">
    <!-- Page header -->
    {#key show}
      <div class="pb-4 text-center">
        <ShowDetail {show} />
        {#if canBuyTicket}
          <label for="buy-ticket" class="btn btn-secondary m-4"
            >Buy Ticket</label
          >
        {/if}
      </div>
    {/key}
    <input type="checkbox" id="buy-ticket" class="modal-toggle" />
    <div class="modal">
      <div class="modal-box relative">
        <label
          for="buy-ticket"
          class="btn btn-sm btn-circle absolute right-2 top-2">✕</label
        >
        {#if canBuyTicket}
          <div
            class="grid grid-rows-1 gap-4 grid-flow-col justify-center items-center"
          >
            <div
              class="bg-cover  bg-no-repeat rounded-full h-48 w-48 row-span-2"
              style="background-image: url('{profileImage}')"
            />
            <form
              method="post"
              action="?/reserve_ticket"
              use:enhance={onSubmit}
            >
              <div class="max-w-xs w-full py-2 form-control ">
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label for="caller" class="label">
                  <span class="label-text">Your Name</span></label
                >
                <div class="rounded-md shadow-sm mt-1 relative">
                  <input
                    name="name"
                    type="text"
                    class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
                    bind:value={displayName}
                  />
                  {#if form?.missingName}<div
                      class="shadow-lg alert alert-error"
                    >
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
                  {#if form?.missingPin}<div
                      class="shadow-lg alert alert-error"
                    >
                      Pin is required
                    </div>{/if}
                  {#if form?.invalidPin}<div
                      class="shadow-lg alert alert-error"
                    >
                      Pin must be 8 digits
                    </div>{/if}
                </div>
              </div>

              <div class="py-4 text-center">
                <button
                  class="btn btn-secondary "
                  type="submit"
                  disabled={waiting4StateChange}>Reserve</button
                >
              </div>
            </form>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

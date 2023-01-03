<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';

  import {
    publicShowDB,
    type PublicShowDBType,
  } from '$lib/ORM/dbs/publicShowDB';
  import { StorageTypes } from '$lib/ORM/rxdb';
  import { onMount } from 'svelte';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  const token = data.token;
  let ticket = data.ticket;
  let showId = $page.params.id;

  $: waiting4StateChange = false;

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
                ticket = _show as ShowDocument;
                waiting4StateChange = false;
              }
            });
          }
        });
      }
    );
  });
</script>

<div class="mt-6 flex items-center">
  <div class="min-w-full">
    <!-- Page header -->
    {#key ticket}
      <div class="pb-4 text-center">
        <ShowDetail show={ticket} />
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
            <form method="post" action="?/buy_ticket" use:enhance={onSubmit}>
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

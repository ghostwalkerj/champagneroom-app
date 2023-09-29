<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { applyAction, enhance } from '$app/forms';
  import { PUBLIC_PROFILE_IMAGE_PATH } from '$env/static/public';

  import { ShowStatus } from '$lib/models/show';

  import getProfileImage from '$lib/util/profilePhoto';

  import ShowDetail from '$components/ShowDetail.svelte';
  import { showStore } from '$stores';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  let show = data.show;
  let displayName = data.displayName;
  let isBuyingTicket = false;
  let showUnSub: Unsubscriber;

  $: isLoading = false;
  $: profileImage = getProfileImage(displayName, PUBLIC_PROFILE_IMAGE_PATH);
  $: canBuyTicket =
    show.showState.status === ShowStatus.BOX_OFFICE_OPEN || isBuyingTicket;
  const onSubmit = () => {
    isBuyingTicket = true;
    isLoading = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        isLoading = false;
        isBuyingTicket = false;
      }
      await applyAction(result);
    };
  };
  onMount(() => {
    showUnSub = showStore(show).subscribe((_show) => {
      show = _show;
    });
  });

  onDestroy(() => {
    showUnSub?.();
  });
</script>

<div class="mt-4 h-full">
  <div class="flex flex-row justify-center h-full">
    <!-- Page header -->
    <div class="pb-4 text-center w-full max-w-xl">
      {#key show.showState}
        <ShowDetail {show} />
      {/key}
      {#if canBuyTicket}
        <input type="checkbox" id="buy-ticket" class="modal-toggle" />
        <div class="modal">
          <div
            class="modal-box relative bg-gradient-to-r from-[#0C082E] to-[#0C092E]"
          >
            <label
              for="buy-ticket"
              class="btn btn-sm btn-circle absolute right-2 top-2">✕</label
            >
            <div
              class="grid grid-rows-1 gap-4 grid-flow-col justify-center items-center"
            >
              <div
                class="bg-cover bg-no-repeat rounded-full h-48 w-48 row-span-2"
                style="background-image: url('{profileImage}')"
              />
              <form
                method="post"
                action="?/reserve_ticket"
                use:enhance={onSubmit}
                class="font-Roboto"
              >
                <div class="max-w-xs w-full py-2 form-control">
                  <!-- svelte-ignore a11y-label-has-associated-control -->
                  <label for="caller" class="label">
                    <span class="label-text">Your Name</span></label
                  >
                  <div class="rounded-md shadow-sm mt-1 relative">
                    <input
                      name="name"
                      type="text"
                      class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary"
                      bind:value={displayName}
                    />
                    {#if form?.missingName}<div
                        class="shadow-lg alert alert-error"
                      >
                        Name is required
                      </div>{/if}
                  </div>
                </div>
                <div class="max-w-xs w-full py-2 form-control">
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
                    <div class="text-center text-sm p-1">
                      You need a pin to access the ticket later!
                    </div>
                  </div>
                </div>

                <div class="py-4 text-center">
                  {#if isLoading}
                    <button
                      class="btn btn-secondary loading"
                      type="submit"
                      disabled={true}>Reserving</button
                    >
                  {:else}
                    <button
                      class="btn btn-secondary"
                      type="submit"
                      disabled={isLoading}>Reserve</button
                    >
                  {/if}
                </div>
              </form>
            </div>
          </div>
        </div>
        <label for="buy-ticket" class="btn btn-secondary m-4">Buy Ticket</label>
      {/if}
    </div>
  </div>
</div>

<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import { onDestroy, onMount } from 'svelte';

  import { applyAction, deserialize, enhance } from '$app/forms';

  import { ShowStatus } from '$lib/models/show';

  import Config from '$lib/config';
  import getProfileImage from '$lib/profilePhoto';

  import ShowDetail from '$components/ShowDetail.svelte';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  let show = data.show;
  let displayName = data.displayName;
  let isBuyingTicket = false;
  //let showUnSub: Unsubscriber;

  $: isLoading = false;
  $: profileImage = getProfileImage(displayName, Config.UI.profileImagePath);
  $: canBuyTicket =
    show.showState.status === ShowStatus.BOX_OFFICE_OPEN || isBuyingTicket;
  const setPinAuth = async (userId: string, pin: string) => {
    const body = new FormData();
    body.append('pin', pin);
    body.append('userId', userId);
    const response = await fetch('?/pin_auth', {
      method: 'POST',
      body,
      redirect: 'follow'
    });

    const result: ActionResult = deserialize(await response.text());
    applyAction(result);
  };
  const onSubmit = () => {
    isBuyingTicket = true;
    isLoading = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        isLoading = false;
        isBuyingTicket = false;
      }
      await applyAction(result);
      if (result.type === 'success') {
        await setPinAuth(result.data.userId, result.data.pin);
      }
    };
  };
  onMount(() => {
    // showUnSub = notifyUpdate({
    //   id: show._id.toString(),
    //   type: 'Show',
    //   callback: () => {
    //     show = $page.data.show;
    //   }
    // });
  });

  onDestroy(() => {
    //showUnSub?.();
  });
</script>

<div class="flex flex-col lg:flex-row justify-center mt-4">
  <!-- Page header -->
  <div class="pb-4 text-center w-full lg:max-w-xl mx-auto">
    {#key show.showState}
      <ShowDetail {show} />
    {/key}
    {#if canBuyTicket}
      <input type="checkbox" id="buy-ticket" class="daisy-modal-toggle" />
      <div class="daisy-modal">
        <div
          class="daisy-modal-box relative bg-gradient-to-r from-[#0C082E] to-[#0C092E]"
        >
          <label
            for="buy-ticket"
            class="daisy-btn daisy-btn-sm daisy-btn-circle absolute right-2 top-2"
            >✕</label
          >
          <div
            class="grid grid-rows-1 gap-4 grid-flow-col justify-center items-center"
          >
            <div
              class="bg-cover bg-no-repeat rounded-full h-24 w-24 lg:h-48 lg:w-48 row-span-2"
              style="background-image: url('{profileImage}')"
            />
            <form
              method="post"
              action="?/reserve_ticket"
              use:enhance={onSubmit}
              class="font-Roboto w-full lg:max-w-xs"
            >
              <input type="hidden" name="profileImage" value={profileImage} />
              <div class="py-2 form-control">
                <label for="caller" class="label">
                  <span class="label-text">Your Name</span>
                </label>
                <input
                  name="name"
                  type="text"
                  class="daisy-input daisy-input-bordered daisy-input-primary"
                  bind:value={displayName}
                />
                {#if form?.missingName}
                  <div class="daisy-alert daisy-alert-error">
                    Name is required
                  </div>
                {/if}
              </div>
              <div class="py-2 form-control">
                <label for="pin" class="label">
                  <span class="label-text">8 Digit Pin</span>
                </label>
                <input
                  name="pin"
                  type="text"
                  class="daisy-input daisy-input-bordered daisy-input-primary"
                  value={form?.pin ?? ''}
                  minlength="8"
                  maxlength="8"
                />
                {#if form?.missingPin}
                  <div class="daisy-alert daisy-alert-error">
                    Pin is required
                  </div>
                {/if}
                {#if form?.invalidPin}
                  <div class="daisy-alert daisy-alert-error">
                    Pin must be 8 digits
                  </div>
                {/if}
                <div class="text-center text-sm p-1">
                  You need a pin to access the ticket later!
                </div>
              </div>
              <div class="py-4 text-center">
                {#if isLoading}
                  <button class="daisy-btn daisy-btn-secondary loading" disabled
                    >Reserving</button
                  >
                {:else}
                  <button
                    class="daisy-btn daisy-btn-secondary"
                    disabled={isLoading}>Reserve</button
                  >
                {/if}
              </div>
            </form>
          </div>
        </div>
      </div>
      <label for="buy-ticket" class="daisy-btn daisy-btn-secondary m-4"
        >Reserve Ticket</label
      >
    {/if}
  </div>
</div>

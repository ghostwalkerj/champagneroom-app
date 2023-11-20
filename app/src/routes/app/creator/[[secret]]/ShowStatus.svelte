<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import type { ShowDocumentType } from '$lib/models/show';
  import type { ShowEventDocumentType } from '$lib/models/showEvent';

  import { createEventText } from '$lib/eventUtil';

  import { ShowEventStore } from '$stores';

  export let canStartShow: boolean;
  export let isLoading = false;
  export let onGoToShow: () => void;
  export let show: ShowDocumentType | undefined;
  export let showEvent: ShowEventDocumentType | undefined;
  let showEventUnSub: Unsubscriber | undefined;

  onMount(() => {
    if (show)
      showEventUnSub = ShowEventStore(show).subscribe((showEvent) => {
        if (showEvent) eventText = createEventText(showEvent);
      });
  });
  onDestroy(() => {
    showEventUnSub?.();
  });

  $: statusText = show ? show.showState.status : 'No Current Show';
  $: eventText = createEventText(showEvent);
</script>

<div class="flex flex-col lg:flex-row lg:col-start-3 lg:col-span-1">
  <div class="bg-primary text-primary-content card w-full">
    <div class="text-center card-body -m-4 items-center">
      <!-- Flex container for responsive layout -->
      <div class="flex flex-col lg:flex-row w-full justify-between gap-2">
        <!-- Status and Event Text sections -->
        <div class="grow">
          <div class="alert alert-info shadow-lg p-3">
            <div class="flex gap-2">
              <iconify-icon icon="mingcute:information-line" class="text-2xl" />
              <p class="capitalize">{statusText.toLowerCase()}</p>
            </div>
          </div>
        </div>
        <div class="grow">
          <div class="alert alert-info shadow-lg p-3">
            <div class="flex gap-2">
              <iconify-icon icon="mingcute:information-line" class="text-2xl" />
              <p class="capitalize">{eventText}</p>
            </div>
          </div>
        </div>
        <!-- Start Show Button -->
        {#if canStartShow}
          <button
            class="btn lg:w-auto"
            type="submit"
            disabled={isLoading}
            on:click={() => {
              isLoading = true;
              onGoToShow();
            }}>Start Show</button
          >
        {/if}
      </div>
    </div>
  </div>
</div>

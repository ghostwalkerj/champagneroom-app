<script lang="ts">
  import Icon from '@iconify/svelte';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import type { ShowDocument } from '$lib/models/show';
  import type { ShowEventDocument } from '$lib/models/showEvent';

  import { createEventText } from '$lib/eventUtil';

  import { ShowEventStore } from '$stores';

  export let canStartShow: boolean;
  export let isLoading: boolean = false;
  export let onGoToShow: () => void;
  export let show: ShowDocument | undefined;
  export let showEvent: ShowEventDocument | undefined;
  let showEventUnSub: Unsubscriber | undefined;
  $: statusText = show ? show.showState.status : 'No Current Show';
  $: eventText = 'No Events';

  onMount(() => {
    eventText = createEventText(showEvent);

    if (show) {
      if (showEvent && showEvent.show !== show._id) {
        showEvent = undefined;
        eventText = 'No Events';
      }
      showEventUnSub?.();
      showEventUnSub = ShowEventStore(show).subscribe((_showEvent) => {
        if (_showEvent) {
          showEvent = _showEvent;
          eventText = createEventText(_showEvent);
        }
      });
    } else {
      statusText = 'No Current Show';
    }
  });
  onDestroy(() => {
    showEventUnSub?.();
  });
</script>

<div class="flex flex-col lg:flex-row lg:col-start-3 lg:col-span-1">
  <div class="bg-primary text-primary-content daisy-card w-full">
    <div class="text-center daisy-card-body -m-4 items-center">
      <!-- Flex container for responsive layout -->
      <div class="flex flex-col lg:flex-row w-full justify-between gap-2">
        <!-- Status and Event Text sections -->
        <div class="grow">
          <div class="daisy-alert daisy-alert-info shadow-lg p-3">
            <div class="flex gap-2">
              <Icon icon="mingcute:information-line" class="text-2xl" />
              <p class="capitalize">{statusText.toLowerCase()}</p>
            </div>
          </div>
        </div>
        <div class="grow">
          <div class="daisy-alert daisy-alert-info shadow-lg p-3">
            <div class="flex gap-2">
              <Icon icon="mingcute:information-line" class="text-2xl" />
              <p class="capitalize">{eventText}</p>
            </div>
          </div>
        </div>
        <!-- Start Show Button -->
        {#if canStartShow}
          <button
            class="daisy-btn lg:w-auto"
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

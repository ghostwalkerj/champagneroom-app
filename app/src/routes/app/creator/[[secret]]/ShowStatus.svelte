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

<div class="flex flex-col lg:flex-row justify-between bg-custom divide-y lg:divide-y-0 lg:divide-x divide-surface-500 rounded">

  <div class="flex gap-2 p-4 flex-1">
    <Icon icon="mingcute:information-line" class="text-2xl text-secondary" />
    <p class="capitalize">{statusText.toLowerCase()}</p>
  </div>

  <div class="flex gap-2 p-4 flex-1">
    <Icon icon="mingcute:information-line" class="text-2xl text-secondary" />
    <p class="capitalize">{eventText}</p>
  </div>

  {#if canStartShow}
          <button
            class="btn flex-1 lg:rounded-l-none font-semibold variant-filled-primary text-black whitespace-nowrap hover:shadow-lg shadow-black"
            type="submit"
            disabled={isLoading}
            on:click={() => {
              isLoading = true;
              onGoToShow();
            }}>Start Show</button
          >
        {/if}
</div>

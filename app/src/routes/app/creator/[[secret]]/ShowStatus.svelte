<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { goto } from '$app/navigation';

  import type { ShowDocumentType } from '$lib/models/show';
  import type { ShowEventDocumentType } from '$lib/models/showEvent';

  import { createEventText } from '$lib/eventUtil';

  import { ShowEventStore } from '$stores';

  export let canStartShow: boolean;
  export let isLoading = false;
  export let show: ShowDocumentType | undefined;
  export let showEvent: ShowEventDocumentType | undefined;
  export let showTimePath: string;
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

<div class="md:col-start-3 md:col-span-1">
  <div class="bg-primary text-primary-content card">
    <div class="text-center card-body -m-4 items-center">
      <div class="flex w-full flex-row justify-between gap-2">
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
        {#if canStartShow}
          <button
            class="btn"
            type="submit"
            disabled={isLoading}
            on:click={() => {
              isLoading = true;
              goto(showTimePath);
            }}>Start Show</button
          >
        {/if}
      </div>
    </div>
  </div>
</div>

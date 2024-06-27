<script lang="ts">
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';

  import type { ShowDocument } from '$lib/models/show';
  import type { ShowEventDocument } from '$lib/models/showEvent';

  import { createEventText } from '$lib/eventUtil';

  export let canStartShow: boolean;
  export let isLoading: boolean = false;
  export let onGoToShow: () => void;
  export let show: ShowDocument | undefined;
  export let showEvent: ShowEventDocument | undefined;
  $: statusText = 'No Current Show';
  $: eventText = 'No Events';

  onMount(() => {
    eventText = createEventText(showEvent);
    statusText = show === undefined ? 'No Current Show' : show.showState.status;
  });
</script>

<div
  class="bg-custom flex flex-col justify-between divide-y divide-surface-500 rounded lg:flex-row lg:divide-x lg:divide-y-0"
>
  <div class="flex flex-1 gap-2 p-4">
    <Icon
      icon="mingcute:information-line"
      class="text-2xl text-secondary-500"
    />
    <p class="capitalize">{statusText.toLowerCase()}</p>
  </div>

  <div class="flex flex-1 flex-grow gap-2 p-4">
    <Icon
      icon="mingcute:information-line"
      class="text-2xl text-secondary-500"
    />
    <p class="capitalize">{eventText}</p>
  </div>

  {#if canStartShow}
    <div class="flex">
      <button
        class="variant-filled-primary btn whitespace-nowrap font-semibold text-black shadow-black hover:shadow-lg lg:rounded-l-none"
        type="submit"
        disabled={isLoading}
        on:click={() => {
          isLoading = true;
          onGoToShow();
        }}>Start Show</button
      >
    </div>
  {/if}
</div>

<script lang="ts">
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import spacetime from 'spacetime';
  import StarRating from 'svelte-star-rating';

  import type { ShowDocument } from '$lib/models/show';

  import { ShowStatus, currencyFormatter } from '$lib/constants';
  import Icon from '@iconify/svelte';
  export let completedShows: ShowDocument[] = [];
</script>

<div
  class="bg-custom rounded p-4 flex flex-col gap-4 text-center justify-center"
>
  <h2
    class="text-xl font-semibold text-center flex gap-2 items-center justify-center"
  >
    <Icon
      icon="fluent:shifts-activity-20-filled"
      class=" neon-secondary text-2xl"
    />
    <span>Activity</span>
  </h2>
  <p class="">
    {completedShows.length} Completed Show{#if completedShows.length > 1 || completedShows.length == 0}s{/if}
  </p>

  <Accordion autocollapse regionPanel="bg-surface-700">
    {#each completedShows.slice(0, 9) as show, i}
      <AccordionItem open={i == 0}>
        <svelte:fragment slot="lead">
          {#if show.showState.status === ShowStatus.FINALIZED}
            {spacetime(show.showState.finalize?.finalizedAt).format(
              '{month-short} {date-pad}'
            )}
          {:else}
            Pending
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="summary">
          <div class="text-sm text-gray-200 text-right font-semibold">
            {currencyFormatter(show.price.currency).format(show.price.amount)}
          </div>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <div class="flex gap-2 items-start">
            <StarRating
              rating={show.showState.feedbackStats.averageRating ?? 0}
            /> ( {show.showState.feedbackStats.averageRating ?? 0})
          </div>
          {#if show.showState.feedbackStats.comments.length > 0}
            <div class="text-sm text-left -mt-1 flex flex-col gap-1">
              <p class="font-semibold">
                Comments ({show.showState.feedbackStats.comments.length})
              </p>
              <div class="divide-y divide-surface-600">
                {#each show.showState.feedbackStats.comments as comment}
                  <p class="py-2">{comment}</p>
                {/each}
              </div>
            </div>
          {:else}
            <p>No Comments</p>
          {/if}
        </svelte:fragment>
      </AccordionItem>
    {/each}
  </Accordion>
</div>

<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Accordion, AccordionItem, Ratings } from '@skeletonlabs/skeleton';
  import spacetime from 'spacetime';

  import type { ShowDocument } from '$lib/models/show';

  import { currencyFormatter, ShowStatus } from '$lib/constants';
  export let completedShows: ShowDocument[] = [];
</script>

<div
  class="bg-custom flex flex-col justify-center gap-4 rounded p-4 text-center"
>
  <h2
    class="flex items-center justify-center gap-2 text-center text-xl font-semibold"
  >
    <Icon
      icon="fluent:shifts-activity-20-filled"
      class=" neon-secondary text-2xl"
    />
    <span>Activity</span>
  </h2>
  <p class="">
    {completedShows.length} Completed Show{#if completedShows.length > 1 || completedShows.length === 0}s{/if}
  </p>

  <Accordion autocollapse regionPanel="bg-surface-700">
    {#each completedShows.slice(0, 9) as show, index}
      <AccordionItem open={index == 0}>
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
          <div class="text-right text-sm font-semibold text-gray-200">
            {currencyFormatter(show.price.currency).format(show.price.amount)}
          </div>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <div class="flex w-full justify-center text-2xl">
            <Ratings
              value={show.showState.feedbackStats.averageRating ?? 0}
              max={5}
              text="text-yellow-400"
              spacing="m-0"
              class="m-2 max-w-min"
            >
              <svelte:fragment slot="empty">
                <Icon icon="fluent:star-28-regular" />
              </svelte:fragment>
              <svelte:fragment slot="half"
                ><Icon icon="fluent:star-half-28-regular" /></svelte:fragment
              >
              <svelte:fragment slot="full"
                ><Icon icon="fluent:star-28-filled" /></svelte:fragment
              >
            </Ratings>
            <span class="mt-2 text-surface-500">
              ({show.showState.feedbackStats.averageRating.toFixed(2) ??
                0})</span
            >
          </div>
          {#if show.showState.feedbackStats.comments.length > 0}
            <div class="-mt-1 flex flex-col gap-1 text-left text-sm">
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

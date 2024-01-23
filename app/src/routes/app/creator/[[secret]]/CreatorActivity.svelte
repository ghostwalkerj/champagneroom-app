<script lang="ts">
  import { Accordion, AccordionItem, Ratings } from '@skeletonlabs/skeleton';
  import spacetime from 'spacetime';

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
          <div class="text-2xl flex w-full justify-center">
            <Ratings
              value={show.showState.feedbackStats.averageRating ?? 0}
              max={5}
              text="text-yellow-400"
              spacing="m-0"
              class="max-w-min m-2"
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
            <span class="text-base mt-2">
              ({show.showState.feedbackStats.averageRating.toFixed(2) ??
                0})</span
            >
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

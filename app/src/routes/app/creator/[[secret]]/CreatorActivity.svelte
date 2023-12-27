<script lang="ts">
  import spacetime from 'spacetime';
  import StarRating from 'svelte-star-rating';

  import type { ShowDocument } from '$lib/models/show';

  import { ShowStatus, currencyFormatter } from '$lib/constants';
  import Icon from '@iconify/svelte';
  export let completedShows: ShowDocument[] = [];
</script>

<div class="bg-primary text-primary-content daisy-card">
  <div class="text-left daisy-card-body items-center">
    <h2 class="text-2xl daisy-card-title">Activity</h2>
    <h2 class="text-lg daisy-card-title">
      {completedShows.length} Completed Show{#if completedShows.length > 1}s{/if}
    </h2>

    <ul class="w-full">
      {#each completedShows.slice(0, 9) as show}
        <li>
          <div class="flex flex-row w-full my-2">
            <Icon
              icon="mingcute:award-fill"
              class="text-xl text-primary-content"
            />

            <div class="flex flex-col w-full">
              <div class="flex flex-row w-full place-content-between">
                <div class="text-sm text-gray-200 whitespace-nowrap ml-3">
                  {#if show.showState.status === ShowStatus.FINALIZED}
                    {spacetime(show.showState.finalize?.finalizedAt).format(
                      '{month-short} {date-pad}'
                    )}
                  {/if}
                </div>
                <div class="text-sm text-gray-200">
                  {currencyFormatter(show.price.currency).format(
                    show.price.amount
                  )}
                </div>
              </div>
              <div class="flex flex-row w-full">
                {#if show.showState.feedbackStats.averageRating > 0}
                  <div class="ml-3 -mb-3">
                    <StarRating
                      rating={show.showState.feedbackStats.averageRating ?? 0}
                    />
                  </div>
                {/if}
              </div>
              {#if show.showState.feedbackStats.comments.length > 0}
                <div class="text-sm text-gray-200 ml-3">
                  {#each show.showState.feedbackStats.comments as comment}
                    {comment}
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>

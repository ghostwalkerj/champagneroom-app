<script lang="ts">
  import type { ShowDocType } from '$lib/ORM/models/show';
  import { currencyFormatter, durationFormatter } from '$lib/util/constants';
  import StarRating from 'svelte-star-rating';
  export let show: ShowDocType;
</script>

{#if show}
  <div class="w-screen flex justify-center">
    <div
      class="flex flex-col w-full  p-4  max-w-2xl  gap-4 rounded-xl bg-base-200 h-[85vh]"
    >
      <div
        class="bg-cover bg-no-repeat bg-center rounded-xl h-3/5 lg:h-4/5 "
        style="background-image: url('{show.talentInfo.profileImageUrl}')"
      >
        <div class="relative top-1 left-2 text-lg">{show.name}</div>
      </div>
      <div class="text-center">
        {show.talentInfo.name}
      </div>
      <div class="place-self-center">
        <StarRating rating={show.talentInfo.stats.ratingAvg} />
      </div>
      <div
        class="stats stats-vertical stats-shadow text-center lg:stats-horizontal"
      >
        <div class="stat">
          <div class="stat-title">Duration</div>
          <div class="text-primary stat-value">
            {durationFormatter(show.duration)}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Price</div>
          <div class="text-primary stat-value">
            {currencyFormatter.format(show.price)}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Tickets Available</div>
          <div class="text-primary stat-value">
            {show.maxNumTickets - show.salesStats.ticketsSold}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

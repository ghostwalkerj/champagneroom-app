<script lang="ts">
  import { ShowStatus, type ShowDocType } from '$lib/ORM/models/show';
  import { currencyFormatter, durationFormatter } from '$lib/util/constants';
  import StarRating from 'svelte-star-rating';
  export let show: ShowDocType;
  $: waterMark = true;
  $: waterMarkText = '';

  $: switch (show.showState.status) {
    case ShowStatus.CANCELLED:
      waterMarkText = 'Cancelled';
      break;

    case ShowStatus.BOX_OFFICE_CLOSED:
      waterMarkText = 'Sold Out';
      break;
    case ShowStatus.STARTED:
      waterMarkText = 'Box Office Closed';
      break;
    case ShowStatus.FINALIZED:
    case ShowStatus.ENDED:
    case ShowStatus.IN_ESCROW:
    case ShowStatus.IN_DISPUTE:
      waterMarkText = 'ENDED';
      break;

    default:
      waterMark = false;
  }
</script>

{#if show}
  <div class=" flex justify-center">
    <div
      class="flex  flex-col w-full p-4 max-w-2xl  gap-4 rounded-xl bg-base-200  overflow-auto"
    >
      <div
        class="relative bg-cover bg-no-repeat bg-center rounded-xl h-96"
        style="background-image: url('{show.talentInfo.profileImageUrl}')"
      >
        <div class="absolute top-1 left-2 text-lg">{show.name}</div>
        {#if waterMark}
          <div
            class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50  rounded-xl"
          />
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl lg:text-8xl text-red-900 -rotate-45"
          >
            {waterMarkText}
          </div>
        {/if}
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
            {show.showState.ticketsAvailable}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

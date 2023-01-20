<script lang="ts">
  import { PUBLIC_SHOW_PATH } from '$env/static/public';
  import { ShowStatus, type ShowDocType } from '$lib/ORM/models/show';
  import { currencyFormatter, durationFormatter } from '$lib/util/constants';
  import StarRating from 'svelte-star-rating';
  import urlJoin from 'url-join';

  export let show: ShowDocType | null;
  export let showCopy = false;
  export let showSalesStats = false;
  $: waterMarkText = '';
  $: showStatus = show?.showState.status;

  const copyShowUrl = () => {
    const showUrl = urlJoin(
      window.location.origin,
      PUBLIC_SHOW_PATH,
      show!._id
    );
    navigator.clipboard.writeText(showUrl);
  };

  $: switch (showStatus) {
    case ShowStatus.CANCELLED:
      waterMarkText = 'Cancelled';
      break;

    case ShowStatus.BOX_OFFICE_CLOSED:
      waterMarkText = 'No Tickets Available';
      break;
    case ShowStatus.STARTED:
      waterMarkText = 'No Tickets Available';
      break;
    case ShowStatus.FINALIZED:
    case ShowStatus.ENDED:
    case ShowStatus.IN_ESCROW:
    case ShowStatus.IN_DISPUTE:
      waterMarkText = 'ENDED';
      break;

    default:
      waterMarkText = '';
  }
</script>

{#if show}
  <div class=" flex justify-center">
    <div
      class="flex  flex-col w-full p-4   gap-4 rounded-xl bg-base-200  overflow-auto"
    >
      <div
        class="relative bg-cover bg-no-repeat bg-center rounded-xl h-[calc(50vh)]"
        style="background-image: url('{show.talentInfo.profileImageUrl}')"
      >
        <div class="absolute top-1 left-2 text-lg">{show.name}</div>
        {#if waterMarkText}
          <div
            class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50  rounded-xl"
          />
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl lg:text-8xl text-red-900 -rotate-45 whitespace-nowrap"
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
      {#if showSalesStats}
        <div
          class="stats stats-vertical stats-shadow text-center lg:stats-horizontal"
        >
          <div class="stat">
            <div class="stat-title">Reserved</div>
            <div class="text-primary stat-value">
              {show.showState.ticketsReserved}
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Sold</div>
            <div class="text-primary stat-value">
              {show.showState.ticketsSold}
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Total Sales</div>
            <div class="text-primary stat-value">
              {currencyFormatter.format(show.showState.totalSales)}
            </div>
          </div>
        </div>
      {/if}
      {#if showCopy}
        <div class="text-center">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div class="btn btn-primary" on:click={copyShowUrl}>
            Copy Show Link
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

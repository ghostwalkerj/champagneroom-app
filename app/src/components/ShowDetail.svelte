<script lang="ts">
  import { onMount } from 'svelte';
  import StarRating from 'svelte-star-rating';
  import urlJoin from 'url-join';

  import { type ShowDocumentType, ShowStatus } from '$lib/models/show';

  import Config from '$lib/config';
  import { currencyFormatter, durationFormatter } from '$lib/constants';

  type ShowDetailOptions = {
    showCopy?: boolean;
    showSalesStats?: boolean;
    showStats?: boolean;
    showRating?: boolean;
    showWaterMark?: boolean;
  };
  let defaultOptions: ShowDetailOptions = {
    showCopy: false,
    showSalesStats: false,
    showStats: true,
    showRating: true,
    showWaterMark: true
  };
  export let options: ShowDetailOptions = defaultOptions;

  export let show: ShowDocumentType;

  options = {
    ...defaultOptions,
    ...options
  };
  $: showStatus = show.showState.status;
  $: waterMarkText = '';
  $: name = show.name;
  $: duration = durationFormatter(show.duration * 60);
  $: price = currencyFormatter().format(show.price.amount);
  const salesStats = show.showState.salesStats;
  $: ticketsAvailable = salesStats.ticketsAvailable;
  $: ticketsReserved = salesStats.ticketsReserved;
  $: ticketsSold = salesStats.ticketsSold;
  $: ticketsRefunded = salesStats.ticketsRefunded;
  $: totalRefunded = currencyFormatter(show.price.currency).format(
    ticketsRefunded * show.price.amount
  );
  $: totalSales = currencyFormatter(show.price.currency).format(
    ticketsSold * show.price.amount
  );

  const copyShowUrl = () => {
    const showUrl = urlJoin(
      window.location.origin,
      Config.Path.show,
      show._id.toString()
    );
    navigator.clipboard.writeText(showUrl);
  };

  onMount(() => {
    if (options.showWaterMark) {
      switch (showStatus) {
        case ShowStatus.BOX_OFFICE_CLOSED: {
          waterMarkText = 'Sold Out';
          break;
        }
        case ShowStatus.BOX_OFFICE_OPEN: {
          waterMarkText = 'Tickets Available';
          break;
        }

        default: {
          waterMarkText = showStatus;
          break;
        }
      }
    }
  });
</script>

{#if show}
  <div
    class="flex flex-col h-full justify-end relative p-2 lg:p-4 bg-base-200 rounded-xl min-h-[620px] bg-cover font-CaviarDreams"
    style="background-image: url('{show.coverImageUrl}')"
  >
    <div class="flex flex-col">
      <div
        class="absolute top-2 left-2 text-sm lg:text-lg text-primary ring-1 lg:ring-2 ring-primary bg-base-200 p-1 lg:p-2 ring-inset rounded-xl"
      >
        {name}
      </div>
      {#if options.showRating}
        <div
          class="absolute top-2 right-2 text-sm lg:text-lg text-primary ring-1 lg:ring-2 ring-primary bg-base-200 p-1 lg:p-2 ring-inset rounded-xl text-center"
        >
          <div>
            {show.creatorInfo.name}
          </div>
          <div>
            <StarRating rating={show.creatorInfo.averageRating} />
          </div>
        </div>
      {/if}

      {#if options.showWaterMark && waterMarkText}
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl lg:text-5xl -rotate-45 whitespace-nowrap font-bold lg:font-extrabold text-primary ring-1 lg:ring-2 ring-primary bg-base-200 p-1 lg:p-2 ring-inset rounded-xl"
        >
          {waterMarkText}
        </div>
      {/if}

      {#if options.showStats}
        <div class="w-full flex justify-center items-center">
          <div
            class="flex flex-col md:flex-row w-full space-x-1 lg:space-x-2 max-w-sm min-w-fit md:max-w-full justify-center"
          >
            <div
              class="daisy-stats daisy-stats-horizontal daisy-stats-shadow text-center mb-1 lg:mb-2 border border-primary bg-black"
            >
              <div class="daisy-stat">
                <div class="daisy-stat-title text-xs lg:text-base">
                  Duration
                </div>
                <div class="text-primary daisy-stat-value text-sm lg:text-lg">
                  {duration}
                </div>
              </div>
              <div class="daisy-stat">
                <div class="daisy-stat-title text-xs lg:text-base">Price</div>
                <div class="text-primary daisy-stat-value text-sm lg:text-lg">
                  {price}
                </div>
              </div>
              <div class="daisy-stat">
                <div class="daisy-stat-title text-xs lg:text-base">
                  Available
                </div>
                <div class="text-primary daisy-stat-value text-sm lg:text-lg">
                  {ticketsAvailable}
                </div>
              </div>
            </div>
            {#if options.showSalesStats}
              <div
                class="daisy-stats daisy-stats-horizontal daisy-stats-shadow text-center mb-1 lg:mb-2 border border-primary bg-black"
              >
                <div class="daisy-stat">
                  <div class="daisy-stat-title text-xs lg:text-base">
                    Reserved
                  </div>
                  <div class="text-primary daisy-stat-value text-sm lg:text-lg">
                    {ticketsReserved}
                  </div>
                </div>
                <div class="daisy-stat">
                  <div class="daisy-stat-title text-xs lg:text-base">Sold</div>
                  <div class="text-primary daisy-stat-value text-sm lg:text-lg">
                    {ticketsSold}
                  </div>
                </div>
                {#if ticketsRefunded > 0}
                  <div class="daisy-stat">
                    <div class="daisy-stat-title text-xs lg:text-base">
                      Refunded
                    </div>
                    <div
                      class="text-primary daisy-stat-value text-sm lg:text-lg"
                    >
                      {ticketsRefunded}
                    </div>
                  </div>
                {/if}
                {#if +totalRefunded > 0}
                  <div class="daisy-stat">
                    <div class="daisy-stat-title text-xs lg:text-base">
                      Refunded Amount
                    </div>
                    <div
                      class="text-primary daisy-stat-value text-sm lg:text-lg"
                    >
                      {totalRefunded}
                    </div>
                  </div>
                {/if}
                <div class="daisy-stat">
                  <div class="daisy-stat-title text-xs lg:text-base">
                    Total Sales
                  </div>
                  <div class="text-primary daisy-stat-value text-sm lg:text-lg">
                    {totalSales}
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    {#if options.showCopy}
      <div class="text-center mt-2 lg:mt-4">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="daisy-tooltip daisy-tooltip-secondary"
          data-tip="Send this link to your fans"
        >
          <div
            class="daisy-btn daisy-btn-primary text-xs lg:text-sm"
            on:click={copyShowUrl}
          >
            Copy Show Link
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

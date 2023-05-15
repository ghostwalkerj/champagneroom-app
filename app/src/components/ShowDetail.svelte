<script lang="ts">
  import { PUBLIC_SHOW_PATH } from '$env/static/public';
  import type { ShowDocType } from '$lib/models/show';
  import type { TalentDocType } from '$lib/models/talent';
  import { currencyFormatter, durationFormatter } from '$lib/util/constants';
  import { onDestroy, onMount } from 'svelte';
  import StarRating from 'svelte-star-rating';
  import type { Unsubscriber } from 'svelte/store';
  import urlJoin from 'url-join';
  import { showStore } from '$lib/stores';

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
    showWaterMark: true,
  };
  export let show: ShowDocType;
  export let options: ShowDetailOptions = defaultOptions;

  options = {
    ...defaultOptions,
    ...options,
  };
  $: showStatus = show.showState.status;
  $: waterMarkText = showStatus;
  $: name = show.name;
  $: duration = durationFormatter(show.duration);
  $: price = currencyFormatter.format(show.price);
  $: ticketsAvailable = show.showState.salesStats.ticketsAvailable;
  $: ticketsReserved = show.showState.salesStats.ticketsReserved;
  $: ticketsSold = show.showState.salesStats.ticketsSold;
  $: ticketsRefunded = show.showState.salesStats.ticketsRefunded;
  $: totalRefunded = currencyFormatter.format(
    show.showState.salesStats.totalRefunded
  );
  $: totalSales = currencyFormatter.format(
    show.showState.salesStats.totalSales
  );

  let showUnSub: Unsubscriber;

  const setStats = (show: ShowDocType) => {
    showStatus = show.showState.status;
    waterMarkText = showStatus;
    name = show.name;
    duration = durationFormatter(show.duration);
    price = currencyFormatter.format(show.price);
    ticketsAvailable = show.showState.salesStats.ticketsAvailable;
    ticketsReserved = show.showState.salesStats.ticketsReserved;
    ticketsSold = show.showState.salesStats.ticketsSold;
    ticketsRefunded = show.showState.salesStats.ticketsRefunded;
    totalRefunded = currencyFormatter.format(
      show.showState.salesStats.totalRefunded
    );
    totalSales = currencyFormatter.format(show.showState.salesStats.totalSales);
  };

  onDestroy(() => {
    showUnSub?.();
  });

  onMount(async () => {
    if (show) {
      showUnSub = showStore(show).subscribe(s => {
        s && setStats(s);
      });
    }
  });

  const copyShowUrl = () => {
    const showUrl = urlJoin(
      window.location.origin,
      PUBLIC_SHOW_PATH,
      show._id.toString()
    );
    navigator.clipboard.writeText(showUrl);
  };
</script>

{#if show}
  <div
    class="flex flex-col h-full justify-end relative p-4 bg-base-200 rounded-xl min-h-[700px] bg-cover"
    style="background-image: url('{show.coverImageUrl}')"
  >
    <div class="flex flex-col">
      <div
        class="absolute top-4 left-4 text-lg text-primary ring-2 ring-primary bg-base-200 p-2 ring-inset rounded-xl"
      >
        {name}
      </div>
      {#if options.showRating}
        <div
          class="absolute top-4 right-4 text-lg text-primary ring-2 ring-primary bg-base-200 p-2 ring-inset rounded-xl"
        >
          <div class="">
            {show.talentInfo.name}
          </div>
          <div>
            <StarRating rating="{show.talentInfo.ratingAvg}" />
          </div>
        </div>
      {/if}

      {#if options.showWaterMark && waterMarkText}
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl md:text-6xl -rotate-45 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary bg-base-200 p-2 ring-inset rounded-xl"
        >
          {waterMarkText}
        </div>
      {/if}

      {#if options.showStats}
        <div
          class="flex flex-col flex-wrap lg:flex-row w-full place-content-evenly"
        >
          <div class="stats stats-horizontal stats-shadow text-center m-2">
            <div class="stat">
              <div class="stat-title">Duration</div>
              <div class="text-primary stat-value">
                {duration}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Price</div>
              <div class="text-primary stat-value">
                {price}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title whitespace-normal">Available</div>
              <div class="text-primary stat-value">
                {ticketsAvailable}
              </div>
            </div>
          </div>
          {#if options.showSalesStats}
            <div class="stats stats-horizontal stats-shadow text-center m-2">
              <div class="stat">
                <div class="stat-title">Reserved</div>
                <div class="text-primary stat-value">
                  {ticketsReserved}
                </div>
              </div>
              <div class="stat">
                <div class="stat-title">Sold</div>
                <div class="text-primary stat-value">
                  {ticketsSold}
                </div>
              </div>
              {#if ticketsRefunded > 0}
                <div class="stat">
                  <div class="stat-title">Refunded</div>
                  <div class="text-primary stat-value">
                    {ticketsRefunded}
                  </div>
                </div>
              {/if}
              {#if +totalRefunded > 0}
                <div class="stat">
                  <div class="stat-title whitespace-normal">
                    Refunded Amount
                  </div>
                  <div class="text-primary stat-value">totalRefunded }</div>
                </div>
              {/if}
              <div class="stat">
                <div class="stat-title whitespace-normal">Total Sales</div>
                <div class="text-primary stat-value">{totalSales}</div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
    {#if options.showCopy}
      <div class="text-center">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="btn btn-primary" on:click="{copyShowUrl}">
          Copy Show Link
        </div>
      </div>
    {/if}
  </div>
{/if}

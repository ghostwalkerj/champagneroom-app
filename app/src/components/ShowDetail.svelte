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
      Config.PATH.show,
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
<div class="grid md:grid-cols-2 bg-surface-800 rounded">

  <div class="relative">
    <img src={show.coverImageUrl} alt="show" class="w-full max-w-xl m-auto rounded-l">
    {#if options.showWaterMark && waterMarkText}
        <p
          class="absolute p-2 font-SpaceGrotesk font-extrabold text-black text-xl bg-primary/70 w-full whitespace-nowrap top-0 rounded-tl"
        >
          {waterMarkText}
  </p>
      {/if}
  </div>

  <div class="flex flex-col justify-evenly">
    <div class="p-4 pb-0 flex flex-col items-center gap-2">
      <h1 class="text-4xl font-extrabold uppercase">{name}</h1>
      {#if options.showRating}
    <StarRating rating={show.creatorInfo.averageRating} />
    {/if}
    </div>

    <slot />

    {#if options.showCopy}
      <div>
        <button class="btn font-semibold variant-filled-primary mb-1" on:click={copyShowUrl}>Copy Show Link</button>
        <p>Share whith your fans</p>  
      </div>
      {/if}

    {#if options.showStats}
      <div class="grid grid-cols-3 p-2 text-xl font-semibold">
       
        <div>
          <p>Duration</p>
          <p>{duration}</p>
        </div>

        <div>
          <p>Price</p>
          <p>{price}</p>
        </div>

        <div>
          <p>Available</p>
          <p>{ticketsAvailable}</p>
        </div>

      </div>
    {/if}
    </div>

  </div>

  
    {#if options.showSalesStats}
    <div class="flex sm:flex-row rounded-b flex-col justify-between border-t border-surface-600 py-2 bg-surface-700  font-semibold divide-x divide-surface-500 text-center
     [&>div]:w-full [&>div]:whitespace-nowrap [&>div]:p-2 [&>div]:flex [&>div]:sm:flex-col [&>div]:gap-2">

      <div>
        <p>Reserved</p>
        <p >{ticketsReserved}</p>
      </div>

      <div >
        <p>Sold</p>
        <p>{ticketsSold}</p>
      </div>


      <div>
        <p>Refunded</p>
        <p>{ticketsRefunded}</p>
      </div>


          <div>
            <p>Refunded Amount</p>
            <p>{totalRefunded}</p>
          </div>


      <div>
        <p>Total Sales</p>
        <p>{totalSales}</p>
      </div>

    </div>
    {/if}

{/if}



<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Ratings } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { page } from '$app/stores';

  import type { ShowDocument } from '$lib/models/show';

  import config from '$lib/config';
  import {
    currencyFormatter,
    durationFormatter,
    ShowStatus
  } from '$lib/constants';

  import CopyText from '$components/CopyText.svelte';

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

  export let show: ShowDocument;

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

  const showPath = urlJoin(
    $page.url.origin,
    config.PATH.show,
    show._id.toString()
  );

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

<div class="rounded !text-center shadow-lg">
  {#if show}
    <div class="bg-custom grid rounded-r !text-center md:grid-cols-2">
      <div class="relative">
        <img
          src={show.coverImageUrl}
          alt="show"
          class="m-auto max-h-fit w-full max-w-xl rounded-l"
        />
        {#if options.showWaterMark && waterMarkText}
          <p
            class="absolute top-0 w-full whitespace-nowrap rounded-tl bg-primary/70 p-2 font-SpaceGrotesk text-xl font-extrabold text-black"
          >
            {waterMarkText}
          </p>
        {/if}
      </div>

      <div class="flex flex-col justify-evenly rounded-tr">
        <div class="flex flex-col items-center gap-2 p-4 pb-0">
          <h1 class="text-4xl font-extrabold uppercase">{name}</h1>

          {#if options.showRating}
            <div class="mb-5 text-2xl md:mb-0">
              <Ratings
                bind:value={show.creatorInfo.averageRating}
                max={5}
                text="text-yellow-400"
                spacing="m-0"
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
            </div>
          {/if}
        </div>

        <slot />

        {#if options.showCopy}
          <div>
            <CopyText
              copyValue={showPath}
              class="neon-primary variant-soft-primary btn btn-lg mb-1 font-semibold"
              >Copy Show Link</CopyText
            >

            <p>Share with your fans</p>
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
      <div
        class="bg-custom flex flex-col justify-between divide-x divide-surface-500 rounded-b border-t border-surface-600 !text-center font-semibold sm:flex-row
     [&>div]:flex [&>div]:w-full [&>div]:gap-2 [&>div]:whitespace-nowrap [&>div]:p-2 [&>div]:sm:flex-col"
      >
        <div>
          <p>Reserved</p>
          <p>{ticketsReserved}</p>
        </div>

        <div>
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
</div>

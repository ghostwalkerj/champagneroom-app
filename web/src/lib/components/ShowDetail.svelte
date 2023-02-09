<script lang="ts">
  import { PUBLIC_SHOW_PATH } from '$env/static/public';
  import type { ShowDocType, showSchema } from '$lib/ORM/models/show';
  import { currencyFormatter, durationFormatter } from '$lib/util/constants';
  import StarRating from 'svelte-star-rating';
  import urlJoin from 'url-join';

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
  export let show: ShowDocType | null;
  export let options: ShowDetailOptions = defaultOptions;

  options = {
    ...defaultOptions,
    ...options,
  };
  $: showStatus = show?.showState.status;
  $: waterMarkText = showStatus ?? '';

  const copyShowUrl = () => {
    const showUrl = urlJoin(
      window.location.origin,
      PUBLIC_SHOW_PATH,
      show!._id
    );
    navigator.clipboard.writeText(showUrl);
  };
</script>

{#if show}
  <div class="flex justify-center h-full relative">
    <div
      class="flex flex-col bg-cover w-full p-4 gap-4 rounded-xl bg-base-200 min-h-[800px]"
      style="background-image: url('{show.talentInfo.profileImageUrl}')"
    >
      <div class="h-full">
        <div
          class="absolute top-2 left-2 text-lg text-primary ring-2 ring-primary  bg-base-200 p-2  ring-inset rounded-xl"
        >
          {show.name}
        </div>
        {#if options.showRating}
          <div
            class="absolute top-2 right-2 text-lg text-primary ring-2 ring-primary  bg-base-200 p-2 ring-inset rounded-xl"
          >
            <div class="">
              {show.talentInfo.name}
            </div>
            <div>
              <StarRating rating={show.talentInfo.stats.ratingAvg} />
            </div>
          </div>
        {/if}

        {#if options.showWaterMark && waterMarkText}
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl md:text-6xl  -rotate-45 whitespace-nowrap font-extrabold  text-primary ring-2 ring-primary  bg-base-200 p-2  ring-inset rounded-xl"
          >
            {waterMarkText}
          </div>
        {/if}
      </div>

      {#if options.showStats}
        <div class="text-center flex-row justify-center space-y-4">
          <div class="stats stats-horizontal stats-shadow text-center ">
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
              <div class="stat-title whitespace-normal">Available</div>
              <div class="text-primary stat-value">
                {show.showState.ticketsAvailable}
              </div>
            </div>
          </div>
          {#if options.showSalesStats}
            <div class="stats stats-horizontal stats-shadow text-center ">
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
              {#if show.showState.ticketsRefunded > 0}
                <div class="stat">
                  <div class="stat-title">Refunded</div>
                  <div class="text-primary stat-value">
                    {show.showState.ticketsRefunded}
                  </div>
                </div>
              {/if}
              {#if show.showState.refundedAmount > 0}
                <div class="stat">
                  <div class="stat-title whitespace-normal">
                    Refunded Amount
                  </div>
                  <div class="text-primary stat-value">
                    {currencyFormatter.format(show.showState.refundedAmount)}
                  </div>
                </div>
              {/if}
              <div class="stat">
                <div class="stat-title  whitespace-normal">Total Sales</div>
                <div class="text-primary stat-value">
                  {currencyFormatter.format(show.showState.totalSales)}
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      {#if options.showCopy}
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

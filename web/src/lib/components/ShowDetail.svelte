<script lang="ts">
  import { PUBLIC_SHOW_PATH } from '$env/static/public';
  import type { ShowDocType, showSchema } from '$lib/ORM/models/show';
  import { currencyFormatter, durationFormatter } from '$lib/util/constants';
  import StarRating from 'svelte-star-rating';
  import urlJoin from 'url-join';

  type ShowDetailOptions = {
    showCopy?: boolean;
    showSalesStats?: boolean;
    showName?: boolean;
    showStats?: boolean;
    showRating?: boolean;
  };
  let defaultOptions: ShowDetailOptions = {
    showCopy: false,
    showSalesStats: false,
    showName: true,
    showStats: true,
    showRating: true,
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
  <div class="flex justify-center h-full ">
    <div class="flex flex-col w-full p-4 gap-4 rounded-xl bg-base-200">
      <div
        class="relative bg-cover bg-no-repeat rounded-xl h-full min-h-[450px]"
        style="background-image: url('{show.talentInfo.profileImageUrl}')"
      >
        <div
          class="absolute top-2 left-2 text-lg text-black ring-2 bg-info p-2  ring-inset rounded-xl"
        >
          {show.name}
        </div>
        {#if waterMarkText}
          <div
            class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50  rounded-xl"
          />
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl lg:text8xl text-red-900 -rotate-45 whitespace-nowrap font-extrabold"
          >
            {waterMarkText}
          </div>
        {/if}
      </div>
      {#if options.showName}
        <div class="text-center">
          {show.talentInfo.name}
        </div>
      {/if}
      {#if options.showRating}
        <div class="place-self-center">
          <StarRating rating={show.talentInfo.stats.ratingAvg} />
        </div>
      {/if}
      {#if options.showStats}
        <div class="text-center flex justify-center ">
          <div
            class="stats stats-vertical md:stats-horizontal stats-shadow text-center "
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
              <div class="stat-title whitespace-normal">Available</div>
              <div class="text-primary stat-value">
                {show.showState.ticketsAvailable}
              </div>
            </div>
            {#if options.showSalesStats}
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
            {/if}
          </div>
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

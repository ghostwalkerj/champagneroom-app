<script lang="ts">
  import urlJoin from 'url-join';

  import type { ShowDocumentType } from '$lib/models/show';
  import type { TicketDocumentType } from '$lib/models/ticket';
  import type { UserDocumentType } from '$lib/models/user';

  import config from '$lib/config';
  import {
    currencyFormatter,
    durationFormatter,
    TicketStatus
  } from '$lib/constants';
  export let show: ShowDocumentType;
  export let ticket: TicketDocumentType;
  export let user: UserDocumentType;

  // Show
  const creatorName = show.creatorInfo.name;
  const showName = show.name;
  const showCoverImageUrl = show.coverImageUrl;
  const showDuration = durationFormatter(show.duration * 60);
  const showUrl = urlJoin(config.PATH.show, show._id.toString());

  // Ticket
  $: ticketStatus = ticket
    ? ticket.ticketState.sale
      ? 'Paid' + ' ' + ticket.ticketState.status
      : ticket.ticketState.status
    : '';
  const currency = ticket.price.currency || 'USD';
  const customerName = user.name;
  const ticketPrice = currencyFormatter(currency).format(ticket.price.amount);

  let isFullScreen = false;

  function toggleFullScreen() {
    isFullScreen = !isFullScreen;
  }
</script>

<div class="flex justify-center font-CaviarDreams">
  <div
    class="flex max-w-4xl flex-col overflow-hidden rounded-xl bg-black md:h-auto md:w-full"
  >
    <!-- Adjust grid layout: 2 columns on mobile, 5 on medium and larger screens -->
    <div class="group grid h-full grid-cols-2 md:min-h-[200px] md:grid-cols-5">
      <!-- Image Section: Take full width on mobile, 1/5th on medium and larger screens -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="relative col-span-2 md:col-span-1"
        on:click={toggleFullScreen}
      >
        <!-- Add click event to open full-screen image -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="grid h-48 w-full cursor-pointer grid-flow-row bg-cover bg-center opacity-70 md:h-full"
          style="background-image: url('{showCoverImageUrl}');"
        />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-fit animate-pulse">
            <div
              class="-rotate-45 whitespace-nowrap rounded-xl p-2 font-bold text-primary ring-2 ring-inset ring-primary"
            >
              {creatorName}
            </div>
          </div>
        </div>
      </div>

      <!-- Content Section: Take full width on mobile, 3/5th on medium and larger screens -->
      <div
        class="relative col-span-2 flex h-full flex-col place-content-center p-4 text-sm font-bold text-info md:col-span-3"
      >
        <!-- Ticket Status Overlays -->
        {#if ticket.ticketState.status === TicketStatus.CANCELLED || ticket.ticketState.status === TicketStatus.FINALIZED}
          <div
            class="absolute left-1/2 top-4 z-20 -translate-x-1/2 transform whitespace-normal rounded-xl bg-base-200 p-2 text-xl font-extrabold text-primary opacity-70 ring-2 ring-inset ring-primary lg:text-2xl"
          >
            {ticket.ticketState.status === TicketStatus.CANCELLED
              ? 'Ticket Cancelled'
              : "Show's Over"}
          </div>
        {/if}

        <!-- Background Logo -->
        <div
          class="absolute inset-0 top-2 bg-cover bg-center opacity-10"
          style="background-image: url('{config.PATH
            .staticUrl}/assets/logo-horizontal-tr.png'); z-index: 0;"
        />

        <!-- Ticket Information (Aligned at the bottom) -->
        <div class="mt-auto">
          <div>Ticket Reserved for: {customerName}</div>
          <div class="capitalize">Ticket Status: {ticketStatus}</div>
          <div class="text-sm">Price: {ticketPrice}{currency}</div>
        </div>
      </div>

      <!-- Right Side Content: Take full width on mobile, 1/5th on medium and larger screens -->
      <div
        class="relative col-span-2 flex items-center border-t-2 border-dashed pb-4 md:col-span-1 md:border-l-2 md:border-t-0 md:pb-0"
      >
        <!-- Added dashed border -->
        <div class="m-auto font-bold text-info">
          <div class="p-2 text-xl"><a href={showUrl}>{showName}</a></div>
          <div class="text-sm">Duration: {showDuration}</div>
          <div class="text-sm">Price: {ticketPrice}{currency}</div>
        </div>
      </div>
    </div>
  </div>
  <!-- Full Screen Image Overlay -->
  {#if isFullScreen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center bg-black bg-opacity-80"
      on:click={toggleFullScreen}
    >
      <!-- svelte-ignore a11y-img-redundant-alt -->
      <img
        class="max-h-full max-w-full cursor-pointer"
        src={showCoverImageUrl}
        alt="Full Screen Image"
      />
    </div>
  {/if}
</div>

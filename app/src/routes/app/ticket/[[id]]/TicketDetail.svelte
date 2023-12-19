<script lang="ts">
  import urlJoin from 'url-join';

  import type { ShowDocumentType } from '$lib/models/show';
  import type { TicketDocumentType } from '$lib/models/ticket';
  import type { UserDocumentType } from '$lib/models/user';

  import Config from '$lib/config';
  import {
    TicketStatus,
    currencyFormatter,
    durationFormatter
  } from '$lib/constants';
  export let show: ShowDocumentType;
  export let ticket: TicketDocumentType;
  export let user: UserDocumentType;

  // Show
  const creatorName = show.creatorInfo.name;
  const showName = show.name;
  const showCoverImageUrl = show.coverImageUrl;
  const showDuration = durationFormatter(show.duration * 60);
  const showUrl = urlJoin(Config.PATH.show, show._id.toString());

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
    class="flex flex-col md:w-full max-w-4xl rounded-xl bg-black overflow-hidden md:h-auto"
  >
    <!-- Adjust grid layout: 2 columns on mobile, 5 on medium and larger screens -->
    <div class="group grid grid-cols-2 md:grid-cols-5 h-full md:min-h-[200px]">
      <!-- Image Section: Take full width on mobile, 1/5th on medium and larger screens -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="col-span-2 md:col-span-1 relative"
        on:click={toggleFullScreen}
      >
        <!-- Add click event to open full-screen image -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="grid grid-flow-row bg-center bg-cover w-full h-48 md:h-full opacity-70 cursor-pointer"
          style="background-image: url('{showCoverImageUrl}');"
        />
        <div class="absolute inset-0 flex justify-center items-center">
          <div class="w-fit animate-pulse">
            <div
              class="-rotate-45 whitespace-nowrap font-bold text-primary ring-2 ring-primary p-2 ring-inset rounded-xl"
            >
              {creatorName}
            </div>
          </div>
        </div>
      </div>

      <!-- Content Section: Take full width on mobile, 3/5th on medium and larger screens -->
      <div
        class="col-span-2 md:col-span-3 relative flex flex-col p-4 text-info font-bold text-sm h-full place-content-center"
      >
        <!-- Ticket Status Overlays -->
        {#if ticket.ticketState.status === TicketStatus.CANCELLED || ticket.ticketState.status === TicketStatus.FINALIZED}
          <div
            class="absolute top-4 left-1/2 transform -translate-x-1/2 text-xl lg:text-2xl whitespace-normal font-extrabold text-primary ring-2 ring-primary bg-base-200 p-2 ring-inset rounded-xl z-20 opacity-70"
          >
            {ticket.ticketState.status === TicketStatus.CANCELLED
              ? 'Ticket Cancelled'
              : "Show's Over"}
          </div>
        {/if}

        <!-- Background Logo -->
        <div
          class="bg-center bg-cover opacity-10 absolute inset-0 top-2"
          style="background-image: url('{Config.PATH
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
        class="col-span-2 md:col-span-1 relative flex items-center border-t-2 md:border-l-2 md:border-t-0 border-dashed pb-4 md:pb-0"
      >
        <!-- Added dashed border -->
        <div class="m-auto font-bold text-info">
          <div class="text-xl p-2"><a href={showUrl}>{showName}</a></div>
          <div class="text-sm">Duration: {showDuration}</div>
          <div class="text-sm">Price: {ticketPrice}{currency}</div>
        </div>
      </div>
    </div>
  </div>
  <!-- Full Screen Image Overlay -->
  {#if isFullScreen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-black bg-opacity-80 z-50"
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

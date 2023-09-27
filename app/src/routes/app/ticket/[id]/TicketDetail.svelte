<script lang="ts">
  import { onMount } from 'svelte';

  import { PUBLIC_STATIC_URL } from '$env/static/public';

  import type { ShowDocumentType } from '$lib/models/show';
  import { type TicketDocumentType, TicketStatus } from '$lib/models/ticket';

  import type { DisplayInvoice } from '$lib/bitcart/models';
  import { currencyFormatter, durationFormatter } from '$lib/constants';
  export let invoice: DisplayInvoice;
  export let show: ShowDocumentType;
  export let ticket: TicketDocumentType;

  // Show
  const showStatus = show.showState.status;
  const creatorName = show.creatorInfo.name;
  const showName = show.name;
  const showCoverImageUrl = show.coverImageUrl;
  const showDuration = durationFormatter(show.duration * 60);
  let copied: 'Copy' | 'Copied' = 'Copy';

  // Ticket
  $: ticketStatus = ticket
    ? ticket.ticketState.totalPaid >= ticket.price
      ? 'Paid' + ' ' + ticket.ticketState.status
      : ticket.ticketState.status
    : '';
  const currency = ticket.currency || 'USD';
  const ticketPaymentAddress = ticket.paymentAddress || '';
  const customerName = ticket.customerName;
  const ticketPrice = currencyFormatter(currency).format(ticket.price);

  // Invoice
  const invoiceStatus = invoice.status;
  $: invoiceTimeLeft = invoice.time_left;

  const timer = setInterval(() => {
    if (invoiceTimeLeft > 0) {
      invoiceTimeLeft--;
    }
  }, 1000);

  onMount(() => {
    return () => clearInterval(timer);
  });
</script>

<div class="flex justify-center font-CaviarDreams">
  <div class="flex flex-col w-full max-w-2xl rounded-xl bg-black overflow-auto">
    <div class="group grid grid-cols-4">
      <div class="relative">
        <div
          class="grid grid-flow-row bg-center bg-cover w-full h-32 opacity-70"
          style="background-image: url('{showCoverImageUrl}');  "
        />
        <div class="absolute inset-0">
          <div class="w-full flex place-content-center">
            <div class="w-fit animate-pulse">
              <div
                class="-rotate-45 origin-bottom-right whitespace-nowrap font-bold text-primary ring-2 ring-primary p-2 ring-inset rounded-xl"
              >
                {creatorName}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="col-span-2 relative flex flex-col p-4 text-info font-bold text-sm"
      >
        {#if ticketStatus === TicketStatus.CANCELLED}
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl whitespace-nowrap font-extrabold text-primary ring-2 ring-primary bg-base-200 p-2 ring-inset rounded-xl z-20 opacity-70 -rotate-[20deg]"
          >
            Cancelled
          </div>
        {/if}

        <div
          class="bg-center bg-cover h-28 opacity-10 absolute inset-0 top-2"
          style="background-image: url('{PUBLIC_STATIC_URL}/assets/logo-horizontal-tr.png') z-0"
        />
        <div>Ticket Reserved for: {customerName}</div>
        <div class="capitalize">Payment Status: {invoiceStatus}</div>
        <div>Time Left to Pay: {durationFormatter(invoiceTimeLeft)}</div>
        <div class="tooltip tooltip-primary" data-tip={copied}>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="z-10"
            on:click={() => {
              copied = 'Copied';
              navigator.clipboard.writeText(ticketPaymentAddress);
            }}
            on:mouseleave={() => {
              copied = 'Copy';
            }}
          >
            Payment Address: {ticketPaymentAddress?.slice(
              0,
              6
            )}...{ticketPaymentAddress?.slice(-4)}
          </div>
        </div>
        <div>
          Sent Amount: {currencyFormatter(currency).format(
            ticket.ticketState.totalPaid
          )}
        </div>
      </div>
      <div class="relative border-l-2 border-dashed">
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary p-2 ring-inset rounded-xl animate-pulse opacity-70"
        >
          {creatorName}
        </div>
        <!-- <div
          class="grid grid-flow-row bg-center bg-contain w-full h-32 opacity-70 animate-pulse"
          style="background-image: url('{PUBLIC_STATIC_URL}/assets/bottlesnlegs-black.jpg');  "
        /> -->
        <div class="m-auto font-bold absolute inset-0 text-info">
          <div class="text-xl p-2">
            {showName}
          </div>

          <div class="text-sm">
            Duration: {showDuration}
          </div>
          <div class="text-sm">
            Price: {ticketPrice}
            {currency}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

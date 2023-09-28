<script lang="ts">
  import { onMount } from 'svelte';
  import { QRCodeImage } from 'svelte-qrcode-image';

  import { type TicketDocumentType, TicketStatus } from '$lib/models/ticket';

  import type { DisplayInvoice } from '$lib/bitcart/models';
  import { durationFormatter } from '$lib/constants';
  import type { PaymentType } from '$lib/util/payment';

  export let invoice: DisplayInvoice;
  export let ticket: TicketDocumentType;

  const ticketStatus = ticket.ticketState.status;
  const invoiceStatus = invoice.status;
  let invoiceTimeLeft = invoice.time_left;

  const currentPayment = invoice?.payments?.[
    invoice?.payments?.length - 1
  ] as PaymentType;

  // Invoice
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

<div class="flex justify-center font-CaviarDreams text-info text-center">
  <div class="flex flex-col w-full max-w-2xl rounded-xl bg-black overflow-auto">
    <div class="text-2xl font-bold m-4">Invoice</div>
    <div class="grid grid-cols-2">
      {#if ticketStatus !== TicketStatus.CANCELLED}
        <div class:text-warning={invoiceTimeLeft < 600}>
          <span class="font-bold">Time Left to Pay: </span>{invoiceTimeLeft
            ? durationFormatter(invoiceTimeLeft)
            : 'None'}
        </div>
      {:else}
        <div><span class="font-bold">Time Left to Pay: </span>None</div>
      {/if}

      <div class="capitalize">
        <span class="font-bold">Payment Status: </span>
        {invoiceStatus}
      </div>

      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="z-10 tooltip tooltip-primary"
        id="payment-amount"
        data-tip="Copy"
        on:click={() => {
          navigator.clipboard.writeText(currentPayment['amount']);
        }}
      >
        <div class="text-center">
          <span class="font-bold">Amount: </span>

          {currentPayment['amount']}
          {currentPayment['currency'].toLocaleUpperCase()}
        </div>
      </div>

      <div class="text-center">
        <span class="font-bold">Rate: </span>
        {currentPayment['rate_str']}
      </div>
      <div class="tooltip tooltip-primary z-10" data-tip="Copy">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="z-10"
          on:click={() => {
            navigator.clipboard.writeText(currentPayment['payment_address']);
          }}
        >
          <span class="font-bold">Payment Address: </span>

          {currentPayment['payment_address']?.slice(0, 6)}...{currentPayment[
            'payment_address'
          ]?.slice(-4)}
        </div>
      </div>

      <div class="tooltip tooltip-primary" data-tip="Copy">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="z-10"
          on:click={() => {
            navigator.clipboard.writeText(currentPayment['payment_url']);
          }}
        >
          <span class="font-bold">Payment URL: </span>

          {currentPayment['payment_url']?.slice(0, 6)}...{currentPayment[
            'payment_url'
          ]?.slice(-4)}
        </div>
      </div>
    </div>
    <div class="flex place-content-center m-10">
      <QRCodeImage text={currentPayment['payment_url']} />
    </div>
  </div>
</div>

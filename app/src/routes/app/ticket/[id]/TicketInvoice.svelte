<script lang="ts">
  import { onMount } from 'svelte';
  import { QRCodeImage } from 'svelte-qrcode-image';

  import { type TicketDocumentType, TicketStatus } from '$lib/models/ticket';

  import { currencyFormatter, durationFormatter } from '$lib/constants';
  import type { PaymentType } from '$lib/util/payment';
  import { InvoiceStatus } from '$lib/util/payment';

  import type { DisplayInvoice } from '$ext/bitcart/models';

  export let invoice: DisplayInvoice;
  export let ticket: TicketDocumentType;

  const ticketStatus = ticket.ticketState.status;
  let invoiceTimeLeft = invoice.time_left;

  const currentPayment = invoice?.payments?.[
    invoice?.payments?.length - 1
  ] as PaymentType;

  let invoiceStatus = '';

  switch (invoice.status) {
    case InvoiceStatus.EXPIRED: {
      invoiceStatus = 'Invoice Expired';
      break;
    }
    case InvoiceStatus.COMPLETE: {
      invoiceStatus = 'Invoice Paid';
      break;
    }
    case InvoiceStatus.INVALID: {
      invoiceStatus = 'Invoice Invalid';
      break;
    }
    case InvoiceStatus.REFUNDED: {
      invoiceStatus = 'Invoice Refunded';
      break;
    }
    default: {
      invoiceStatus = '';
    }
  }

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

<div
  class="relative flex justify-center font-CaviarDreams text-info text-center"
>
  {#if invoice.status === InvoiceStatus.EXPIRED || invoice.status === InvoiceStatus.COMPLETE || invoice.status === InvoiceStatus.INVALID || invoice.status === InvoiceStatus.REFUNDED}
    <div
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl whitespace-nowrap font-extrabold text-primary ring-2 ring-primary p-2 rounded-xl z-20 -rotate-[20deg] capitalize"
    >
      {invoiceStatus}
    </div>
  {/if}

  <div class="flex flex-col w-full max-w-2xl rounded-xl bg-black overflow-auto">
    <div class="text-2xl font-bold mt-4">Invoice</div>
    <div class="text-sm mb-4">
      ( {currencyFormatter(ticket.price.currency).format(ticket.price.amount)}
      {ticket.price.currency} equivalent )
    </div>
    <div class="grid grid-cols-2">
      {#if ticketStatus !== TicketStatus.CANCELLED && invoice.status !== InvoiceStatus.COMPLETE && invoice.status !== InvoiceStatus.INVALID && invoice.status !== InvoiceStatus.REFUNDED}
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
    <div class="flex place-content-center m-6">
      <QRCodeImage text={currentPayment['payment_url']} />
    </div>
    <div class="pb-6">
      {#if invoice.status === InvoiceStatus.EXPIRED}
        <span class="font-bold">Invoice Expired</span>
      {:else if invoice.status === InvoiceStatus.REFUNDED}
        <span class="font-bold">Invoice Refunded</span>
      {:else if invoice.status === InvoiceStatus.COMPLETE}
        Invoice Paid
      {:else}
        Please pay with your connected wallet before <span class="font-bold"
          >Time Left to Pay</span
        >
        runs out
      {/if}
    </div>
  </div>
</div>

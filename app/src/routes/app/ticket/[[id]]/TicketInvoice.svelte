<script lang="ts">
  import spacetime from 'spacetime';
  import { onMount } from 'svelte';

  import type { TicketDocumentType } from '$lib/models/ticket';

  import config from '$lib/config';
  import {
    TicketStatus,
    currencyFormatter,
    durationFormatter
  } from '$lib/constants';
  import type { PaymentType } from '$lib/payment';
  import { InvoiceStatus } from '$lib/payment';

  import type { DisplayInvoice } from '$ext/bitcart/models';

  export let invoice: DisplayInvoice;
  export let ticket: TicketDocumentType;

  const ticketStatus = ticket.ticketState.status;
  let invoiceTimeLeft = invoice.time_left;

  const currentPayment = invoice?.payments?.[
    invoice?.payments?.length - 1
  ] as PaymentType;

  let invoiceStatus = '';

  const today = spacetime.now();

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
      invoiceStatus = 'Waiting for Payment';
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
  class="relative flex flex-col w-full max-w-md md:max-w-2xl mx-auto bg-black shadow-lg rounded-xl overflow-hidden"
>
  <!-- Logo and Invoice Header -->
  <div class="flex items-center justify-between bg-black p-4">
    <img
      src="{config.PATH.staticUrl}/assets/logo-square.png"
      alt="Your Company Logo"
      class="h-12"
    />
    <span
      class="font-bold text-xl text-info absolute left-1/2 transform -translate-x-1/2"
      >Invoice</span
    >
    <!-- Centered Title -->
  </div>

  <!-- Invoice Status Tag -->
  {#if invoice.status === InvoiceStatus.EXPIRED || invoice.status === InvoiceStatus.COMPLETE || invoice.status === InvoiceStatus.INVALID || invoice.status === InvoiceStatus.REFUNDED}
    <div
      class="absolute top-4 right-4 text-xs lg:text-sm xl:text-base font-bold text-info p-1 lg:p-2 xl:p-3 bg-opacity-50 bg-gray-100 rounded-lg capitalize"
    >
      {invoiceStatus}
    </div>
  {/if}

  <!-- Invoice Content -->
  <div class="p-4 text-info">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div>
        <span class="text-sm font-bold">Date: </span>
        {today.format('{day-short} {date-ordinal}')}
      </div>
      <div class="text-sm lg:text-right">
        ( {currencyFormatter(ticket.price.currency).format(ticket.price.amount)}
        {ticket.price.currency} equivalent )
      </div>
    </div>

    <!-- Payment Details Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <!-- Payment Status Section -->
      <div class="capitalize">
        <span class="font-bold">Payment Status: </span>
        {invoiceStatus}
      </div>

      <!-- Amount Section -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="daisy-tooltip daisy-tooltip-primary"
        id="payment-amount"
        data-tip="Copy"
        on:click={() => {
          navigator.clipboard.writeText(currentPayment['amount']);
        }}
      >
        <div class="text-left lg:text-right">
          <span class="font-bold">Amount: </span>
          {currentPayment['amount']}
          {currentPayment['currency'].toLocaleUpperCase()}
        </div>
      </div>
    </div>

    <!-- Rate and Time Left Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div>
        <span class="font-bold">Rate: </span>
        {currentPayment['rate']}
      </div>

      <!-- Time Left to Pay Section -->
      {#if ticketStatus !== TicketStatus.CANCELLED && invoice.status !== InvoiceStatus.COMPLETE && invoice.status !== InvoiceStatus.INVALID && invoice.status !== InvoiceStatus.REFUNDED}
        <div class="text-warning-500 lg:text-right">
          <span class="font-bold">Time Left to Pay: </span>
          {invoiceTimeLeft ? durationFormatter(invoiceTimeLeft) : 'None'}
        </div>
      {:else}
        <div class="lg:text-right">
          <span class="font-bold">Time Left to Pay: </span>None
        </div>
      {/if}
    </div>

    <!-- Additional Invoice Information -->
    <div class="text-center italic mb-4">
      {#if invoice.status === InvoiceStatus.EXPIRED}
        <span class="font-bold">Invoice Expired</span>
      {:else if invoice.status === InvoiceStatus.REFUNDED}
        <span class="font-bold">Invoice Refunded</span>
      {:else if invoice.status === InvoiceStatus.COMPLETE}
        Invoice Paid
      {:else}
        Please pay with your connected wallet before <span class="font-bold"
          >Time Left to Pay</span
        > runs out
      {/if}
    </div>
  </div>
</div>

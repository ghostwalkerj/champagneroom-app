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
  import type { PaymentType } from '$lib/payout';
  import { InvoiceStatus } from '$lib/payout';

  import type { DisplayInvoice } from '$ext/bitcart/models';
  import CopyText from '$components/CopyText.svelte';

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
  class="relative mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-black shadow-lg md:max-w-2xl"
>
  <!-- Logo and Invoice Header -->
  <div class="flex items-center justify-between bg-black p-4">
    <img
      src="{config.PATH.staticUrl}/assets/logo-square.png"
      alt="Your Company Logo"
      class="h-12"
    />
    <span
      class="absolute left-1/2 -translate-x-1/2 transform text-xl font-bold text-info"
      >Invoice</span
    >
    <!-- Centered Title -->
  </div>

  <!-- Invoice Status Tag -->
  {#if invoice.status === InvoiceStatus.EXPIRED || invoice.status === InvoiceStatus.COMPLETE || invoice.status === InvoiceStatus.INVALID || invoice.status === InvoiceStatus.REFUNDED}
    <div
      class="absolute right-4 top-4 rounded-lg bg-gray-100 bg-opacity-50 p-1 text-xs font-bold capitalize text-info lg:p-2 lg:text-sm xl:p-3 xl:text-base"
    >
      {invoiceStatus}
    </div>
  {/if}

  <!-- Invoice Content -->
  <div class="p-4 text-info">
    <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
    <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- Payment Status Section -->
      <div class="capitalize">
        <span class="font-bold">Payment Status: </span>
        {invoiceStatus}
      </div>

      <!-- Amount Section -->
      <div class="text-left lg:text-right">
        <span class="font-bold">Amount: </span>

        <CopyText copyValue={currentPayment['amount']}>
          {currentPayment['amount']}</CopyText
        >
        {currentPayment['currency'].toLocaleUpperCase()}
      </div>
    </div>

    <!-- Rate and Time Left Section -->
    <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
    <div class="mb-4 text-center italic">
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

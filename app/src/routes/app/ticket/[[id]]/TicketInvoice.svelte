<script lang="ts">
  import spacetime from 'spacetime';
  import { onMount } from 'svelte';

  import type { TicketDocumentType } from '$lib/models/ticket';

  import config from '$lib/config';
  import { currencyFormatter, durationFormatter } from '$lib/constants';
  import { InvoiceStatus, type PaymentType } from '$lib/payments';

  import CopyText from '$components/CopyText.svelte';
  import type { DisplayInvoice } from '$ext/bitcart/models';

  export let invoice: DisplayInvoice;
  export let ticket: TicketDocumentType;

  let invoiceTimeLeft = invoice?.time_left || 0;

  const currentPayment = invoice?.payments?.[
    invoice?.payments?.length - 1
  ] as PaymentType;

  const today = spacetime.now();

  let invoiceStatusText = 'No Invoice';
  const invoiceStatus = (invoice?.status ||
    ('No Invoice' as InvoiceStatus | 'No Invoice')) as InvoiceStatus;

  const timer = setInterval(() => {
    if (invoiceTimeLeft > 0) {
      invoiceTimeLeft--;
    }
  }, 1000);

  onMount(() => {
    switch (invoiceStatus) {
      case InvoiceStatus.EXPIRED: {
        invoiceStatusText = 'Invoice Expired';
        break;
      }
      case InvoiceStatus.COMPLETE: {
        invoiceStatusText = 'Invoice Paid';
        break;
      }
      case InvoiceStatus.INVALID: {
        invoiceStatusText = 'Invoice Invalid';
        break;
      }
      case InvoiceStatus.REFUNDED: {
        invoiceStatusText = 'Invoice Refunded';
        break;
      }
      case InvoiceStatus.PENDING: {
        invoiceStatusText = 'Invoice Pending';
        break;
      }
      default: {
        invoiceStatusText = 'No Invoice';
        break;
      }
    }
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
      class="text-info-500 absolute left-1/2 -translate-x-1/2 transform text-xl font-bold"
      >Invoice</span
    >
    <!-- Centered Title -->
  </div>

  <!-- Invoice Status Tag -->
  <div
    class="absolute right-4 top-4 rounded-lg bg-gray-100 bg-opacity-50 p-1 text-xs font-bold capitalize text-secondary-500 lg:p-2 lg:text-sm xl:p-3 xl:text-surface-500"
  >
    {invoiceStatusText}
  </div>

  <!-- Invoice Content -->
  <div class="text-info-500 p-4">
    <div class="mb-4 grid grid-cols-1 gap-4">
      <div>
        <span class="text-sm font-bold">Date: </span>
        {today.format('{day-short} {date-ordinal}')}
      </div>

      <!-- Payment Details Grid -->
      <div class=" grid grid-cols-1 gap-4">
        <!-- Payment Status Section -->
        <div class="capitalize">
          <span class="font-bold">Payment Status: </span>
          {invoiceStatus}
        </div>

        <!-- Amount Section -->
        <div class="text-left">
          <span class="font-bold">Amount: </span>

          <CopyText copyValue={currentPayment['amount']}>
            {currentPayment['amount']}</CopyText
          >
          {currentPayment['currency'].toLocaleUpperCase()}
        </div>
        <div class="text-sm">
          ( {currencyFormatter(ticket.price.currency).format(
            ticket.price.amount
          )}
          {ticket.price.currency} equivalent )
        </div>
      </div>
    </div>

    <!-- Rate and Time Left Section -->
    <div class="mb-4 grid grid-cols-1 gap-4">
      <div>
        <span class="font-bold">Rate: </span>
        {currentPayment['rate']}
      </div>

      <!-- Time Left to Pay Section -->
      {#if invoiceStatus === InvoiceStatus.PENDING}
        <div class="text-warning-500">
          <span class="font-bold">Time Left to Pay: </span>
          {invoiceTimeLeft ? durationFormatter(invoiceTimeLeft) : 'None'}
        </div>
      {:else}
        <span class="font-bold">Time Left to Pay: </span>None
      {/if}
    </div>

    <!-- Additional Invoice Information -->
    <div class="mb-4 text-center italic">
      {#if invoiceStatus === InvoiceStatus.EXPIRED}
        <span class="font-bold">Invoice Expired</span>
      {:else if invoiceStatus === InvoiceStatus.REFUNDED}
        <span class="font-bold">Invoice Refunded</span>
      {:else if invoiceStatus === InvoiceStatus.COMPLETE}
        Invoice Paid
      {:else}
        Please pay with your connected wallet before <span class="font-bold"
          >Time Left to Pay</span
        > runs out
      {/if}
    </div>
  </div>
</div>

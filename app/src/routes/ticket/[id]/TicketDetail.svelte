<script lang="ts">
  import {
    PUBLIC_DEFAULT_PROFILE_IMAGE,
    PUBLIC_PROFILE_IMAGE_PATH,
  } from '$env/static/public';
  import { currencyFormatter, durationFormatter } from '$lib/constants';
  import type { ShowDocumentType } from '$lib/models/show';
  import type { TicketDocType } from '$lib/models/ticket';
  import getProfileImage from '$util/profilePhoto';
  export let show: ShowDocumentType;
  export let ticket: TicketDocType;

  $: profileImage = ticket.ticketState.reservation
    ? getProfileImage(
        ticket.ticketState.reservation.name,
        PUBLIC_PROFILE_IMAGE_PATH
      )
    : PUBLIC_DEFAULT_PROFILE_IMAGE;
  $: ticketStatus = ticket
    ? (ticket.ticketState.totalPaid >= ticket.price
      ? 'Paid' + ' ' + ticket.ticketState.status
      : ticket.ticketState.status)
    : '';
  $: showStatus = show.showState.status;
  $: customerName = ticket.ticketState.reservation
    ? ticket.ticketState.reservation.name
    : '';
  $: talentName = show.talentInfo.name;
  $: showName = show.name;
  $: showDuration = durationFormatter(show.duration);
  $: ticketPrice = currencyFormatter.format(ticket.price);
  $: showCoverImageUrl = show.coverImageUrl;
  $: ticketPaymentAddress = ticket.paymentAddress;
</script>

<div class="flex justify-center">
  <div
    class="flex flex-col w-full p-4 max-w-2xl gap-4 rounded-xl bg-base-200 overflow-auto"
  >
    <div class="grid grid-flow-row gap-4">
      <div class="flex gap-4">
        <div class="">
          <div
            class="bg-cover bg-no-repeat rounded-full h-24 w-24 row-span-2"
            style="background-image: url('{profileImage}')"
          ></div>
          <div class="pt-2">
            {customerName}
          </div>
        </div>
        <div class="flex flex-col">
          <div>
            {talentName}
          </div>
          <div>{showName}</div>

          <div class="">
            {showDuration}
          </div>
          <div class="">
            {ticketPrice}
          </div>
        </div>
        <div
          class="relative bg-cover bg-no-repeat bg-center rounded-xl h-32 w-48"
          style="background-image: url('{showCoverImageUrl}')"
        ></div>
      </div>
      <div class="w-full flex">
        <div>Payment Address: {ticketPaymentAddress}</div>
      </div>
      <div class="w-full flex">
        <div>Ticket Status: {ticketStatus}</div>
      </div>

      <div class="w-full flex">
        <div>Show Status: {showStatus}</div>
      </div>
    </div>
  </div>
</div>

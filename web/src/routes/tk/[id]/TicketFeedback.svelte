<script lang="ts">
  import {
    PUBLIC_DEFAULT_PROFILE_IMAGE,
    PUBLIC_PROFILE_IMAGE_PATH,
  } from '$env/static/public';
  import type { ShowDocType } from 'plib/dist/ORM/models/show';
  import type { TicketDocType } from 'plib/dist/ORM/models/ticket';
  import {
    currencyFormatter,
    durationFormatter,
  } from 'plib/dist/util/constants';
  import getProfileImage from 'plib/dist/util/profilePhoto';
  export let show: ShowDocType | null;
  export let ticket: TicketDocType | null;

  $: profileImage = ticket
    ? getProfileImage(
        ticket.ticketState.reservation.name,
        PUBLIC_PROFILE_IMAGE_PATH
      )
    : PUBLIC_DEFAULT_PROFILE_IMAGE;
  $: ticketStatus = ticket
    ? ticket.ticketState.totalPaid >= ticket.ticketState.price
      ? 'Paid' + ' ' + ticket.ticketState.status
      : ticket.ticketState.status
    : '';
  $: showStatus = show ? show.showState.status : '';
</script>

{#if show && ticket}
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
            />
            <div class="pt-2">
              {ticket.ticketState.reservation.name}
            </div>
          </div>
          <div class="flex flex-col">
            <div>
              {show.talentInfo.name}
            </div>
            <div>{show.name}</div>

            <div class="">
              {durationFormatter(show.duration)}
            </div>
            <div class="">
              {currencyFormatter.format(show.price)}
            </div>
          </div>
          <div
            class="relative bg-cover bg-no-repeat bg-center rounded-xl h-32 w-48"
            style="background-image: url('{show.talentInfo.profileImageUrl}')"
          />
        </div>
        <div class="w-full flex">
          <div>Payment Address: {ticket.paymentAddress}</div>
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
{/if}

<script lang="ts">
  import {
    PUBLIC_PROFILE_IMAGE_PATH,
    PUBLIC_STATIC_URL
  } from '$env/static/public';

  import type { ShowDocumentType } from '$lib/models/show';
  import type { TicketDocumentType } from '$lib/models/ticket';

  import { currencyFormatter, durationFormatter } from '$lib/constants';
  import getProfileImage from '$lib/util/profilePhoto';
  export let show: ShowDocumentType;
  export let ticket: TicketDocumentType;

  $: profileImage = getProfileImage(
    ticket.customerName,
    PUBLIC_PROFILE_IMAGE_PATH
  );
  $: ticketStatus = ticket
    ? ticket.ticketState.totalPaid >= ticket.price
      ? 'Paid' + ' ' + ticket.ticketState.status
      : ticket.ticketState.status
    : '';
  const showStatus = show.showState.status;
  const customerName = ticket.customerName;
  const creatorName = show.creatorInfo.name;
  const showName = show.name;
  const showDuration = durationFormatter(show.duration);
  const currency = ticket.currency || 'USD';

  const ticketPrice = currencyFormatter(currency).format(ticket.price);
  const showCoverImageUrl = show.coverImageUrl;
  const ticketPaymentAddress = ticket.paymentAddress;
</script>

<div class="flex justify-center">
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
                class="-rotate-45 origin-bottom-right whitespace-nowrap font-bold text-primary ring-2 ring-primary p-2 ring-inset rounded-xl font-CaviarDreams"
              >
                {creatorName}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="grid grid-flow-row bg-center bg-cover w-full h-32 opacity-70 animate-pulse col-span-2"
        style="background-image: url('{PUBLIC_STATIC_URL}/assets/logo-horizontal-tr.png') "
      />
      <div class="relative border-l-2 border-dashed">
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary p-2 ring-inset rounded-xl font-CaviarDreams animate-pulse opacity-70"
        >
          {creatorName}
        </div>
        <!-- <div
          class="grid grid-flow-row bg-center bg-contain w-full h-32 opacity-70 animate-pulse"
          style="background-image: url('{PUBLIC_STATIC_URL}/assets/bottlesnlegs-black.jpg');  "
        /> -->
        <div
          class="m-auto font-bold font-CaviarDreams absolute inset-0 text-info"
        >
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

    <!-- <div class="">
        <div
          class="bg-cover bg-no-repeat rounded-full h-24 w-24 row-span-2"
          style="background-image: url('{profileImage}')"
        />
        <div class="pt-2">
          {customerName}
        </div>
      </div> -->
    <!-- <div>
        <div class="w-full flex">
          <div>Ticket Status: {ticketStatus}</div>
        </div>

        <div class="w-full flex">
          <div>Show Status: {showStatus}</div>
        </div>
      </div> -->
  </div>
</div>

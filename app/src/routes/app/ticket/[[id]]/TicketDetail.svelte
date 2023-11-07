<script lang="ts">
  import urlJoin from 'url-join';

  import type { ShowDocumentType } from '$lib/models/show';
  import { TicketStatus, type TicketDocumentType } from '$lib/models/ticket';
  import type { UserDocument } from '$lib/models/user';

  import Config from '$lib/config';
  import { currencyFormatter, durationFormatter } from '$lib/constants';
  export let show: ShowDocumentType;
  export let ticket: TicketDocumentType;
  export let user: UserDocument;

  // Show
  const creatorName = show.creatorInfo.name;
  const showName = show.name;
  const showCoverImageUrl = show.coverImageUrl;
  const showDuration = durationFormatter(show.duration * 60);
  const showUrl = urlJoin(Config.Path.show, show._id.toString());

  // Ticket
  $: ticketStatus = ticket
    ? ticket.ticketState.sale
      ? 'Paid' + ' ' + ticket.ticketState.status
      : ticket.ticketState.status
    : '';
  const currency = ticket.price.currency || 'USD';
  const customerName = user.name;
  const ticketPrice = currencyFormatter(currency).format(ticket.price.amount);
</script>

<div class="flex justify-center font-CaviarDreams">
  <div
    class="flex flex-col w-full max-w-2xl rounded-xl bg-black overflow-auto h-32"
  >
    <div class="group grid grid-cols-4 h-full">
      <div class="relative">
        <div
          class="grid grid-flow-row bg-center bg-cover w-full h-full opacity-70"
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
        class="col-span-2 relative flex flex-col p-4 text-info font-bold text-sm h-full place-content-center"
      >
        {#if ticketStatus === TicketStatus.CANCELLED}
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl whitespace-nowrap font-extrabold text-primary ring-2 ring-primary bg-base-200 p-2 ring-inset rounded-xl z-20 opacity-70 -rotate-[20deg]"
          >
            Ticket Cancelled
          </div>
        {/if}

        <div
          class="bg-center bg-cover h-28 opacity-10 absolute inset-0 top-2"
          style="background-image: url('{Config.Path
            .staticUrl}/assets/logo-horizontal-tr.png') z-0"
        />
        <div>Ticket Reserved for: {customerName}</div>
        <div class="capitalize">Ticket Status: {ticketStatus}</div>
        <div class="text-sm">
          Price: {ticketPrice}
          {currency}
        </div>
      </div>
      <div class="relative border-l-2 border-dashed">
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary p-2 ring-inset rounded-xl animate-pulse opacity-70"
        >
          {creatorName}
        </div>

        <div class="m-auto font-bold absolute inset-0 text-info">
          <div class="text-xl p-2"><a href={showUrl}>{showName}</a></div>

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

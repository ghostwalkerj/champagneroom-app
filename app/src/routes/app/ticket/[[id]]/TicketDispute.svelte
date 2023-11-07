<script lang="ts">
  import type { ShowDocumentType } from '$lib/models/show';
  import type { TicketDocumentType } from '$lib/models/ticket';
  import type { UserDocument } from '$lib/models/user';

  import Config from '$lib/config';
  import { currencyFormatter, durationFormatter } from '$lib/constants';
  import getProfileImage from '$lib/profilePhoto';
  export let show: ShowDocumentType;
  export let ticket: TicketDocumentType;
  export let user: UserDocument;

  const customerName = user.name;

  $: profileImage = getProfileImage(customerName, Config.UI.profileImagePath);
  $: ticketStatus = ticket.ticketState.status;

  $: showStatus = show ? show.showState.status : '';
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
          />
          <div class="pt-2">
            {customerName}
          </div>
        </div>
        <div class="flex flex-col">
          <div>
            {show.creatorInfo.name}
          </div>
          <div>{show.name}</div>

          <div class="">
            {durationFormatter(show.duration * 60)}
          </div>
          <div class="">
            {currencyFormatter(show.price.currency).format(show.price.amount)}
          </div>
        </div>
        <div
          class="relative bg-cover bg-no-repeat bg-center rounded-xl h-32 w-48"
          style="background-image: url('{show.creatorInfo.profileImageUrl}')"
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

<script lang="ts">
  import type { ShowDocType } from '$lib/ORM/models/show';
  import type { TicketDocType } from '$lib/ORM/models/ticket';
  import { currencyFormatter, durationFormatter } from '$lib/util/constants';
  import getProfileImage from '$lib/util/profilePhoto';
  export let show: ShowDocType;
  export let ticket: TicketDocType;

  $: profileImage = getProfileImage(ticket.ticketState.reservation.name);
</script>

{#if show}
  <div class="flex justify-center">
    <div
      class="flex flex-col w-full p-4 max-w-2xl gap-4 rounded-xl bg-base-200  overflow-auto"
    >
      <div class="grid grid-flow-row gap-4">
        <div class="flex gap-4 ">
          <div class="">
            <div
              class="bg-cover bg-no-repeat rounded-full h-24 w-24 row-span-2"
              style="background-image: url('{profileImage}')"
            />
            <div>
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
      </div>
    </div>
  </div>
{/if}

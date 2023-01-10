<script lang="ts">
  import type { ShowDocType } from '$lib/ORM/models/show';
  import type { TicketDocType } from '$lib/ORM/models/ticket';
  import { currencyFormatter, durationFormatter } from '$lib/util/constants';
  import getProfileImage from '$lib/util/profilePhoto';
  import StarRating from 'svelte-star-rating';
  export let show: ShowDocType;
  export let ticket: TicketDocType;

  $: profileImage = getProfileImage(ticket.ticketState.reservation.name);
</script>

{#if show}
  <div class="flex justify-center">
    <div
      class="flex flex-col w-full p-4 max-w-2xl  gap-4 rounded-xl bg-base-200  overflow-auto"
    >
      <div class="flex flex-row justify-between">
        <div>
          <div
            class="grid grid-rows-1 gap-4 grid-flow-col justify-center items-center"
          >
            <div
              class="bg-cover  bg-no-repeat rounded-full h-48 w-48 row-span-2"
              style="background-image: url('{profileImage}')"
            />
            <form method="post" action="?/buy_ticket">
              <div class="max-w-xs w-full py-2 form-control ">
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label for="caller" class="label">
                  <span class="label-text">Your Name</span></label
                >
              </div>
              <div class="max-w-xs w-full py-2 form-control ">
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label for="pin" class="label">
                  <span class="label-text">8 Digit Pin</span></label
                >
                <div class="rounded-md shadow-sm mt-1 relative">
                  <input
                    name="pin"
                    type="text"
                    class="max-w-xs w-full py-2 pl-6 input input-bordered input-primary"
                    minlength="8"
                    maxlength="8"
                  />
                </div>
              </div>

              <div class="py-4 text-center">
                <button class="btn btn-secondary " type="submit">Reserve</button
                >
              </div>
            </form>
          </div>
        </div>
        <div class="flex justify-center flex-col">
          <div
            class="relative bg-cover bg-no-repeat bg-center rounded-xl h-96"
            style="background-image: url('{show.talentInfo.profileImageUrl}')"
          >
            <div class="absolute top-1 left-2 text-lg">{show.name}</div>
          </div>
          <div>
            {show.talentInfo.name}
          </div>
          <div class="place-self-center">
            <StarRating rating={show.talentInfo.stats.ratingAvg} />
          </div>
          <div
            class="stats stats-vertical stats-shadow text-center lg:stats-horizontal"
          >
            <div class="stat">
              <div class="stat-title">Duration</div>
              <div class="text-primary stat-value">
                {durationFormatter(show.duration)}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Price</div>
              <div class="text-primary stat-value">
                {currencyFormatter.format(show.price)}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Tickets Available</div>
              <div class="text-primary stat-value">
                {show.showState.ticketsAvailable}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

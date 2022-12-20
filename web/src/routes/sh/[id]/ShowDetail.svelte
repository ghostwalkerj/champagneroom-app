<script lang="ts">
  import type { ShowDocType } from '$lib/ORM/models/show';
  import { currencyFormatter } from '$lib/util/constants';
  import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
  import StarRating from 'svelte-star-rating';
  export let show: ShowDocType;
</script>

{#if show}
  <div class="w-screen flex justify-center">
    <div
      class="flex flex-col w-full  p-4  max-w-2xl  gap-4 rounded-xl bg-base-200 h-[80vh]"
    >
      <div
        class="bg-cover bg-no-repeat bg-center rounded-xl  h-3/5 "
        style="background-image: url('{show.talentInfo.profileImageUrl}')"
      >
        <div class="relative top-1 left-2 text-lg">{show.name}</div>
      </div>
      <div class="text-center">
        {show.talentInfo.name}
      </div>
      <div class="place-self-center">
        <StarRating rating={show.talentInfo.stats.ratingAvg} />
      </div>
      <div class="stats stats-vertical stats-shadow lg:stats-horizontal">
        <div class="stat">
          <div class="text-primary w-10 stat-figure">
            <FaMoneyBillWave />
          </div>
          <div class="stat-title">Price</div>
          <div class="text-primary stat-value">
            {currencyFormatter.format(show.price)}
          </div>
        </div>

        <div class="stat">
          <div class="text-secondary w-10 stat-figure">
            <FaMoneyBillWave />
          </div>
          <div class="stat-title">Funded</div>
          <div class="text-secondary stat-value" />
        </div>
      </div>
      <section
        class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center p-4  items-center justify-center "
      >
        <div>Funding Address</div>
      </section>
    </div>
  </div>
{/if}

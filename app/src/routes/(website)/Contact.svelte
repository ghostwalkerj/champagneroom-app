<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Image } from '@unpic/svelte';

  import Config from '$lib/models/config';

  import type { ActionData } from './$types';
  import type { ActionResult } from '@sveltejs/kit';

  export let form: ActionData;
  let isSubmitted = false;

  const onSubmit = () => {
    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'failure') {
        isSubmitted = false;
      } else if (result.type === 'success') {
        isSubmitted = true;
      }
      await applyAction(result);
    };
  };
</script>

<div id="Contact" class="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
  <div class="pt-20">
    <h2
      class="font-bold text-primary text-2xl text-[32px] lg:text-[41px] text-center font-CaviarDreams mb-20"
    >
      Contact Us
    </h2>
    <div class="flex flex-col lg:flex-row gap-10">
      <div class="w-full lg:w-1/2 mb-10 flex justify-center px-4">
        <Image
          src="{Config.PATH.staticUrl}/assets/creator3.png"
          alt="Creator"
          class="rounded-xl overflow-hidden shadow-[0px_0px_17px_6px_#e779c1] h-auto max-w-xs md:max-w-sm lg:max-w-md"
          height={823}
          width={658}
        />
      </div>
      <div class="w-full lg:w-1/2 flex flex-col justify-center items-center">
        <div
          class="text-info text-2xl md:text-3xl lg:text-4xl font-bold mb-5 lg:mb-10 tracking-wider text-center font-CaviarDreams"
        >
          Thank you for the interest in CHAMPAGNE ROOM!
        </div>
        {#if isSubmitted}
          <div class="daisy-alert daisy-alert-success">
            Your interest has been submitted
          </div>
        {:else}
          <form
            method="post"
            action="?/show_interest"
            use:enhance={onSubmit}
            class="flex flex-col gap-4 items-center justify-center w-full max-w-sm"
          >
            <select
              class="daisy-select daisy-select-primary w-[300px] bg-transparent"
              name="interest"
            >
              <option disabled selected>I am interested in</option>
              <option>Agents</option>
              <option>Creators</option>
              <option>Investors</option>
              <option>Partners</option>
              <option>Other</option>
            </select>
            {#if form?.missingInterest}
              <div class="shadow-lg daisy-alert daisy-alert-error">
                Interest is required
              </div>
            {/if}
            <input
              type="text"
              placeholder="Email"
              name="email"
              class="daisy-input daisy-input-bordered daisy-input-primary w-[300px] bg-transparent"
            />
            {#if form?.badEmail}
              <div class="shadow-lg daisy-alert daisy-alert-error">
                Email is Required
              </div>
            {/if}
            <div class="w-full text-center">
              <button class="daisy-btn daisy-btn-outline daisy-btn-primary w-32"
                >Submit</button
              >
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Image } from '@unpic/svelte';

  import config from '$lib/config';

  import type { ActionResult } from '@sveltejs/kit';
  import type { ActionData } from './$types';

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
      class="mb-20 text-center font-CaviarDreams text-2xl text-[32px] font-bold text-primary lg:text-[41px]"
    >
      Contact Us
    </h2>
    <div class="flex flex-col gap-10 lg:flex-row">
      <div class="mb-10 flex w-full justify-center px-4 lg:w-1/2">
        <Image
          src="{config.PATH.staticUrl}/assets/creator3.png"
          alt="Creator"
          class="h-auto max-w-xs overflow-hidden rounded-xl shadow-[0px_0px_17px_6px_#e779c1] md:max-w-sm lg:max-w-md"
          height={823}
          width={658}
        />
      </div>
      <div class="flex w-full flex-col items-center justify-center lg:w-1/2">
        <div
          class="mb-5 text-center font-CaviarDreams text-2xl font-bold tracking-wider text-info md:text-3xl lg:mb-10 lg:text-4xl"
        >
          Thank you for the interest in CHAMPAGNE ROOM!
        </div>
        {#if isSubmitted}
          <div class="alert variant-filled-success">
            Your interest has been submitted
          </div>
        {:else}
          <form
            method="post"
            action="?/show_interest"
            use:enhance={onSubmit}
            class="flex w-full max-w-sm flex-col items-center justify-center gap-4"
          >
            <select class="select w-[300px]" name="interest">
              <option disabled selected>I am interested in</option>
              <option>Agents</option>
              <option>Creators</option>
              <option>Investors</option>
              <option>Partners</option>
              <option>Other</option>
            </select>
            {#if form?.missingInterest}
              <div class="alert variant-filled-error">Interest is required</div>
            {/if}
            <input
              type="text"
              placeholder="Email"
              name="email"
              class="input w-[300px]"
            />
            {#if form?.badEmail}
              <div class="alert variant-filled-error">Email is Required</div>
            {/if}
            <div class="w-full text-center">
              <button class="variant-filled-primary btn w-32">Submit</button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { PUBLIC_STATIC_URL } from '$env/static/public';

  import type { ActionData } from './$types';

  export let form: ActionData;

  let isSubmitted = false;

  const onSubmit = () => {
    return async ({ result }) => {
      if (result.type === 'failure') {
        isSubmitted = false;
      } else if (result.type === 'success') {
        isSubmitted = true;
      }
      await applyAction(result);
    };
  };
</script>

<div id="Contact" class="container mx-auto px-4 sm:px-20">
  <div class="container mx-auto">
    <div class="pt-10 lg:pt-52">
      <h2
        class="font-bold text-primary text-[41px] text-center font-CaviarDreams mb-10"
      >
        Contact Us
      </h2>
      <div class="flex flex-col lg:flex-row">
        <div
          class="w-full lg:mb-10 m-0 lg:m-10 flex place-content-center"
          data-aos="flip-right"
        >
          <img
            src="{PUBLIC_STATIC_URL}/assets/creator3.png"
            alt="Creator"
            class="rounded-xl overflow-hidden shadow-[0px_0px_17px_6px_#e779c1] h-auto"
          />
        </div>
        <div class="w-full flex flex-col place-content-center">
          <div
            class="text-info text-4xl font-bold capitalize m-5 mt-10 lg:mt-20 tracking-wider text-center font-CaviarDreams"
          >
            Thank you for the interest in CHAMPAGNE ROOM!
          </div>
          <div data-aos="fade-down" class="h-full flex place-content-center">
            {#if isSubmitted}
              <div class="h-full flex flex-col place-content-center">
                <div class="alert alert-success">
                  Your interest has been submitted
                </div>
              </div>
            {:else}
              <form
                method="post"
                action="?/show_interest"
                use:enhance={onSubmit}
                class="flex flex-col gap-4 h-full place-content-center z-10"
              >
                <select
                  class="select select-primary w-full max-w-xs bg-transparent"
                  name="interest"
                >
                  <option disabled selected>I am interested in</option>
                  <option>Agents</option>
                  <option>Creators</option>
                  <option>Investors</option>
                  <option>Partners</option>
                  <option>Other</option>
                </select>
                {#if form?.missingInterest}<div
                    class="shadow-lg alert alert-error"
                  >
                    Interest is required
                  </div>{/if}
                <input
                  type="text"
                  placeholder="Email"
                  name="email"
                  class="input input-bordered input-primary w-[300px] bg-transparent"
                />
                {#if form?.badEmail}<div class="shadow-lg alert alert-error">
                    Email is Required
                  </div>{/if}
                <div class="w-full text-center">
                  <button class="btn btn-outline btn-primary w-32"
                    >Submit</button
                  >
                </div>
              </form>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

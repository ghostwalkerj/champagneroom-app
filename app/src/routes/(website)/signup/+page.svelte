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

<div class="w-screen text-center font-bold text-xl lg:text-2xl xl:text-3xl">
  Sign Up
</div>

<div
  class="absolute mt-2 mx-auto opacity-20 rounded-lg justify-center w-screen h-screen"
  style="background-image: url('{PUBLIC_STATIC_URL}/assets/crbubbles.png')"
/>
<div class="py-10">
  <!-- Page header -->

  <div
    class="mx-auto px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:px-8"
  >
    <div class="flex space-x-5 items-center w-full">
      <div class="fixed top-10 grid grid-cols-2">
        <div
          class="image opacity-20 max-width-l hidden md:flex animate-pulse transition-timing-function mt-20 mb-10"
        >
          <div class="h-xl w-xl">
            <img
              class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 -space-x-20 justify-center w-m h-m"
              src="{PUBLIC_STATIC_URL}/assets/ladyblue.png"
              alt="Lady Blue"
            />
          </div>
        </div>

        <div
          class="image opacity-20 hidden md:flex animate-pulse transition-timing-function mt-20 mb-10"
        >
          <div class="h-xl w-xl">
            <img
              class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 w-m h-m"
              src="{PUBLIC_STATIC_URL}/assets/ladypink.png"
              alt="Lady Pink"
            />
          </div>
        </div>
      </div>
      <div class="w-screen flex place-content-center">
        <div class="max-w-2xl flex flex-col gap-4">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-center mb-2">
                Thank you for showing interest in the Champagne Room
              </h2>
              {#if isSubmitted}
                <div class="alert alert-success">
                  Your interest has been submitted
                </div>
              {:else}
                <form
                  method="post"
                  action="?/show_interest"
                  use:enhance={onSubmit}
                  class="flex flex-col gap-4"
                >
                  <select
                    class="select select-primary w-full max-w-xs"
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
                    class="input input-bordered input-primary w-full max-w-xs"
                  />
                  {#if form?.badEmail}<div class="shadow-lg alert alert-error">
                      Email is Required
                    </div>{/if}
                  <button class="btn btn-primary w-32">Submit</button>
                </form>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

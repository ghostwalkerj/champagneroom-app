<script lang="ts">
  import { Image } from '@unpic/svelte';

  import config from '$lib/config';
</script>

<div id="TheShow" class="mx-auto flex w-full flex-col pt-20">
  <h2
<<<<<<< Updated upstream
    class="text-center font-CaviarDreams text-[32px] font-bold text-primary-500 lg:mb-10 lg:text-[41px]"
=======
    class="text-primary text-center font-CaviarDreams text-[32px] font-bold lg:mb-10 lg:text-[41px]"
>>>>>>> Stashed changes
  >
    The CHAMPAGNE ROOM Show
  </h2>
  <div class="relative px-4 lg:px-10">
    <div
      class="absolute left-0 top-0 h-full w-full overflow-hidden rounded-xl bg-contain opacity-30"
      style="background-image: url('{config.PATH
        .staticUrl}/assets/crbubbles.png')"
    />
    <div class="flex w-full flex-col lg:flex-row">
      <div class="w-full p-4 lg:p-6">
        <span
<<<<<<< Updated upstream
          class="flex text-center font-CaviarDreams text-lg font-bold capitalize tracking-wider text-secondary-500"
=======
          class="text-info flex text-center font-CaviarDreams text-lg font-bold capitalize tracking-wider"
>>>>>>> Stashed changes
        >
          Easy, Safe, Private
        </span>
        <div class="flex flex-col lg:flex-row">
          <div class="w-full font-medium lg:w-1/2 lg:p-6">
            <h1 class="mb-4 text-lg leading-relaxed">
              When you're ready to experience a live one-on-one show, simply ask
              your creator to provide you with a Champagne Room Show link.
            </h1>
            <ul
              class="list-inside list-disc space-y-4 text-left text-lg lg:mt-3"
            >
              <li>
                Click the exclusive link to access detailed show information.
              </li>
              <li>
                Explore the show page to discover pricing, timings, and reviews
                from other fans.
              </li>
              <li>
                Securely reserve and pay for tickets using cryptocurrency.
              </li>
              <li>
                Indulge in the show within your own private VIP Champagne Room.
              </li>
              <li>Share your valuable feedback about your experience.</li>
            </ul>
          </div>
          <div class="mt-4 flex place-content-center p-4 lg:mt-0 lg:w-1/2">
            <Image
              alt="show-screenshot"
              src="{config.PATH.staticUrl}/assets/show-screenshot.png"
              class="h-auto max-w-full overflow-hidden rounded-md shadow-[0px_0px_17px_6px_#e779c1]"
              width={550}
              height={550}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

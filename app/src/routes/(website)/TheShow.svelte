<script lang="ts">
  import config from '$lib/config';
  import { Image } from '@unpic/svelte';
</script>

<div id="TheShow" class="flex flex-col pt-20 w-full mx-auto">
  <h2
    class="text-primary font-bold text-[32px] lg:text-[41px] text-center font-CaviarDreams lg:mb-10"
  >
    The CHAMPAGNE ROOM Show
  </h2>
  <div class="relative px-4 lg:px-10">
    <div
      class="bg-contain rounded-xl overflow-hidden absolute top-0 left-0 w-full h-full opacity-30"
      style="background-image: url('{config.PATH
        .staticUrl}/assets/crbubbles.png')"
    />
    <div class="flex flex-col lg:flex-row w-full">
      <div class="w-full p-4 lg:p-6">
        <span
          class="text-info text-lg font-bold capitalize tracking-wider text-center flex font-CaviarDreams"
        >
          Easy, Safe, Private
        </span>
        <div class="flex flex-col lg:flex-row">
          <div class="w-full lg:w-1/2 lg:p-6 font-medium">
            <h1 class="text-lg mb-4 leading-relaxed">
              When you're ready to experience a live one-on-one show, simply ask
              your creator to provide you with a Champagne Room Show link.
            </h1>
            <ul
              class="text-left list-disc list-inside lg:mt-3 text-lg space-y-4"
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
          <div class="p-4 mt-4 lg:mt-0 lg:w-1/2 flex place-content-center">
            <Image
              alt="show-screenshot"
              src="{config.PATH.staticUrl}/assets/show-screenshot.png"
              class="rounded-md overflow-hidden shadow-[0px_0px_17px_6px_#e779c1] max-w-full h-auto"
              width={550}
              height={550}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

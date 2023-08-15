<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div id="TheShow" class="container pt-52">
  <div class="relative">
    <div
      class="bg-containrounded-xl overflow-hidden absolute top-0 left-0 w-full h-full opacity-30"
      style="background-image: url('{PUBLIC_STATIC_URL}/assets/crbubbles.png') "
    />
    <div class="flex flex-col lg:flex-row items-center">
      <div class="w-full ml-6" data-aos="fade-right">
        <span
          class="text-info text-lg font-normal capitalize tracking-wider text-center flex font-CaviarDreams"
        >
          Easy, Safe, Private
        </span>
        <div class="flex flex-col lg:flex-row place-content-between">
          <div class="pb-6">
            <span
              class="font-bold text-info text-[41px] text-center font-CaviarDreams"
            >
              CHAMPAGNE ROOM Show
            </span>

            <h1 class="text-lg font-normal leading-relaxed">
              When you're ready to experience a live one-on-one show, simply ask
              your creator to provide you with a Champagne Room Show link.
            </h1>
            <ul
              class="text-left list-disc
          list-inside ml-3 mt-3 text-lg"
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

          <div class="p-4 flex w-full place-content-center">
            <img
              alt="show-screenshot"
              src="{PUBLIC_STATIC_URL}/assets/show-screenshot.png"
              class=" rounded-md overflow-hidden shadow-[0px_0px_17px_6px_#e779c1]"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div id="TheShow" class="flex flex-col pt-10 lg:pt-52 w-full mx-auto">
  <h2
    class="text-primary font-bold text-[41px] text-center font-CaviarDreams lg:mb-10"
  >
    The CHAMPAGNE ROOM Show
  </h2>
  <div class="relative px-4 lg:px-10">
    <div
      class="bg-containrounded-xl overflow-hidden absolute top-0 left-0 w-full h-full opacity-30"
      style="background-image: url('{PUBLIC_STATIC_URL}/assets/crbubbles.png') "
    />
    <div class="flex flex-col lg:flex-row w-full">
      <div class="w-full p-4 lg:p-6" data-aos="fade-right">
        <span
          class="text-info text-lg font-bold capitalize tracking-wider text-center flex font-CaviarDreams"
        >
          Easy, Safe, Private
        </span>
        <div class="flex flex-col lg:flex-row">
          <div class="w-full lg:p-6">
            <h1 class="text-lg mb-4 font-normal leading-relaxed">
              When you're ready to experience a live one-on-one show, simply ask
              your creator to provide you with a Champagne Room Show link.
            </h1>
            <ul
              class="text-left list-disc
          list-inside lg:mt-3 text-lg space-y-4"
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

          <div class="p-4 mt-4 lg:mt-0 flex w-full place-content-center">
            <img
              alt="show-screenshot"
              src="{PUBLIC_STATIC_URL}/assets/show-screenshot.png"
              class="rounded-md overflow-hidden shadow-[0px_0px_17px_6px_#e779c1]"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

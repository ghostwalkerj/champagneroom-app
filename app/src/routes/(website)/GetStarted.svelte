<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div
  class="bg-contain mt-20 rounded-xl overflow-hidden"
  style="background-image: url('{PUBLIC_STATIC_URL}/assets/bubbles.png') "
>
  <div id="GetStarted" class="container mx-auto">
    <div class="flex flex-col lg:flex-row items-center">
      <div class="w-full" data-aos="fade-right">
        <span
          class="text-info font-['SpaceGrotesk'] text-lg font-normal capitalize tracking-wider text-center flex"
        >
          Easy, Safe, Private
        </span>
        <div class="flex flex-col lg:flex-row place-content-between">
          <div class="pb-6">
            <span
              class="font-serif font-bold text-info text-[41px] text-center"
            >
              Champagne Room Show
            </span>

            <h1 class="text-lg text-gray-300 font-normal leading-relaxed">
              When you're ready to experience a live one-on-one show, simply ask
              your creator to provide you with a Champagne Room Show link.
            </h1>
            <ul
              class="text-left text-gray-300 list-disc
          list-inside ml-10 mt-10 text-lg"
            >
              <li>Click the unique URL to view show information</li>
              <li>
                On the show page, see the price, timing, and creator reviews
              </li>
              <li>Reserve and pay for tickets with crypto</li>
              <li>Enjoy the show in your private VIP Champagne Room</li>
              <li>Provide feedback on your experience</li>
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

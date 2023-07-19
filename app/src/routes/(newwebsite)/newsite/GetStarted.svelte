<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div
  class="bg-contain py-28 my-10 rounded-xl overflow-hidden"
  style="background-image: url('{PUBLIC_STATIC_URL}/assets/bubbles.jpg') "
>
  <div id="GetStarted" class="container mx-auto px-10 sm:px-24">
    <div
      class="block grid-cols-1 md:grid-cols-2 mx-auto items-center pt-15 pb-15 sm:flex"
    >
      <div class="w-full sm:w-1/2" data-aos="fade-right">
        <span
          class="text-info font-space-grotesk text-lg font-normal capitalize tracking-wider text-center flex"
        >
          Easy, Safe, Private
        </span>
        <br />
        <span class="font-serif font-semibold text-[41px] text-center">
          Champagne Room Show
        </span>
        <br />
        <br />
        <h1
          class="font-space-[grotesk] text-lg text-gray-300 font-normal leading-relaxed"
        >
          When you're ready to experience a live one-on-one show, simply ask
          your creator to provide you with a Champagne Room Show link.
        </h1>
        <ul
          class="text-left font-space-[grotesk] text-gray-300 list-disc
          list-inside ml-10 mt-2"
        >
          <li>Click the unique URL to view show information</li>
          <li>On the show page, see the price, timing, and creator reviews</li>
          <li>Reserve and pay for tickets with crypto</li>
          <li>Enjoy the show in your private VIP Champagne Room/li></li>
          <li>Provide feedback on your experience</li>
        </ul>
      </div>
      <div class="w-full sm:w-1/2" data-aos="flip-left">
        <img
          alt="abc"
          src="{PUBLIC_STATIC_URL}/assets/show-screenshot.png"
          class="rounded-xl overflow-hidden max-w-lg shadow-[0px_0px_17px_6px_#e779c1]"
        />
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div
  class="absolute mt-2 mt-2 mx-auto opacity-20 rounded-lg opacity-10 justify-center justify-center w-screen h-screen"
  style="background-image: url('{PUBLIC_STATIC_URL}/assets/crbubbles.png')"
/>
<div class="py-10">
  <!-- Page header -->

  <div
    class="mx-auto px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:px-8"
  >
    <div class="flex flex-col space-x-5 items-center w-full">
      <div class="fixed top-10 grid grid-cols-2">
        <div
          class="image opacity-20 max-width-l hidden md:flex animate-pulse transition-timing-function mt-20 mb-10"
        >
          <div class="h-xl w-xl">
            <img
              class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 justify-center w-m h-m"
              src="{PUBLIC_STATIC_URL}/assets/ladypink.png"
              alt="Lady Blue"
            />
          </div>
        </div>

        <div
          class="image opacity-20 hidden md:flex animate-pulse transition-timing-function mt-20 mb-10"
        >
          <div class="h-xl w-xl">
            <img
              class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 justify-center w-m h-m"
              src="{PUBLIC_STATIC_URL}/assets/ladyblue.png"
              alt="Lady Pink"
            />
          </div>
        </div>
      </div>
      <div class="text-center text-2xl max-w-xl flex flex-col gap-10">
        <div>
          The Champagne Room is a new way to watch adult content creators live,
          and have 1:1 interactions with them.
        </div>
        <div>
          It's completely anonymous, and you pay with crypto. No signup
          required!
        </div>
        <div>
          We're the first ever full escrow service to protect all parties
          involved in your transaction. We even have a feedback and dispute
          service that helps make sure both parties are happy with the
          experience they have had.
        </div>
        <div>No downloads, no signup, no personal information required.</div>
      </div>
      <div class="p-10 mx-auto">
        <div
          class="max-w-2xl bg-none rounded-xl overflow-hidden
        justify-center shadow-lg border-4 border-primary"
        >
          <video autoplay loop controls muted class="opacity-80">
            <source
              src="{PUBLIC_STATIC_URL}/assets/champagnevideo.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>
    </div>
  </div>
</div>

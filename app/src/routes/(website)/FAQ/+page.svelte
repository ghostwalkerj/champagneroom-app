<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div class="w-screen text-center">FAQ</div>

<div
  class="absolute mt-2 mt-2 mx-auto opacity-20 rounded-lg opacity-10 justify-center justify-center w-screen h-screen"
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
              class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 justify-center w-m h-m"
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
              class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 justify-center w-m h-m"
              src="{PUBLIC_STATIC_URL}/assets/ladypink.png"
              alt="Lady Pink"
            />
          </div>
        </div>
      </div>
      <div class="text-center text-2xl w-full">
        Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit
        eam ad opus nunc et adepto a pCall!
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';

  import About from './About.svelte';
  import Earn from './Earn.svelte';
  import Findus from './Findus.svelte';
  import Play from './Play.svelte';
  import Tokenomics from './Tokenomics.svelte';
</script>

<div data-aos="fade-in" />

<div class="container mx-auto" data-aos="fade-in" id="page1">
  <div
    class="block mt-20 grid-cols-1 px-4 py-10 md:grid-cols-2 sm:flex sm:px-20 am:py-36"
  >
    <div class="w-full mx-0 sm:mx-8 sm:w-2/3">
      <h2
        class=" text-[#d0dce8] text-center font-medium leading-none text-[48px] sm:text-left"
      >
        A new way to watch adult content creators live
      </h2>
      <ul
        class="mt-10 text-[#d0dce8de] text-[25px] font-medium text-lg list-disc list-inside"
      >
        <li class="mt-2">Completely Anonymous</li>
        <li class="mt-2">
          No Downloads, No Signup, and No Personal Information Required!
        </li>
        <li class="mt-2">Protected by a Full Escrow Service</li>
      </ul>
      <div class="flex flex-col md:flex-row mt-10 sm:block space-x-6">
        <button
          class="relative z-0 btn btn-primary transition-all duration-300 ease-in-out font-space-grotesk"
        >
          Read the FAQ
        </button>
        <button
          class="relative z-0 btn btn-secondary transition-all duration-300 ease-in-out font-space-grotesk"
        >
          Checkout the White Paper
        </button>
      </div>
    </div>
    <div class="w-full mt-5 sm:w-1/3 sm:mt-0">
      <video
        autoplay
        loop
        controls
        muted
        class="opacity-80 rounded-xl overflow-hidden"
      >
        <source
          src="{PUBLIC_STATIC_URL}/assets/champagnevideo.mp4"
          type="video/mp4"
        />
      </video>
    </div>
  </div>
</div>
<About />
<Play />
<Earn />
<Tokenomics />
<Findus />

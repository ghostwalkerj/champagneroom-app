<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';

  import About from './About.svelte';
  import FAQ from './FAQ.svelte';
  import FindUs from './FindUs.svelte';
  import GetStarted from './GetStarted.svelte';
  import Tokenomics from './SignUp.svelte';
</script>

<div data-aos="fade-in" />

<div class="container mx-auto" data-aos="fade-in" id="page1">
  <div class="flex flex-col lg:flex-row mt-20 items-center">
    <div class="w-full mx-0">
      <h2
        class=" text-[#d0dce8] text-center font-medium leading-none text-[48px] lg:text-left"
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
      <div
        class="flex flex-col md:flex-row mt-10 space-x-0 md:space-y-0 space-y-6 md:space-x-6 place-content-center lg:place-content-start"
      >
        <a
          href="#FAQ"
          class="w-full md:w-auto btn btn-primary transition-all duration-300 ease-in-out font-['SpaceGrotesk']"
        >
          Read the FAQ
        </a>
        <a
          href="{PUBLIC_STATIC_URL}/assets/champagne-room-white-paper.pdf"
          class="w-full md:w-auto btn btn-secondary transition-all duration-300 ease-in-out font-['SpaceGrotesk'] m-0"
          target="_blank"
        >
          Checkout the White Paper
        </a>
      </div>
    </div>
    <div class="w-full mt-10 lg:ml-10">
      <video
        autoplay
        loop
        controls
        muted
        class="opacity-80 rounded-xl overflow-hidden shadow-[0px_0px_17px_6px_#e779c1]"
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
<GetStarted />
<FAQ />
<Tokenomics />
<FindUs />

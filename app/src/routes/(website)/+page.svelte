<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';

  import About from './About.svelte';
  import FAQ from './FAQ.svelte';
  import GetStarted from './GetStarted.svelte';
  import SignUp from './SignUp.svelte';

  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<div class="flex mt-20 w-screen" data-aos="fade-in" id="page1">
  <div class="flex flex-col lg:flex-row items-center">
    <div class="w-full p-10">
      <h2
        class="text-info text-center font-medium leading-none text-[41px] lg:text-left mb-6"
      >
        A New Way to Discretely View NSFW Creators Live
      </h2>
      <ul class="  text-[25px] font-medium text-lg list-disc list-inside">
        <li class="mt-2">Watch Completely Anonymous</li>
        <li class="mt-2">No Downloads, No Signup, No Personal Information</li>
        <li class="mt-2">Protected by a Full Escrow Service</li>
        <li class="mt-2">Get paid instantly as a Creator</li>
      </ul>
      <div
        class="flex flex-col 2sx:flex-row mt-10 space-x-0 2sx:space-y-0 space-y-6 2sx:space-x-6 place-content-center lg:place-content-start"
      >
        <div>
          <a
            href="#FAQ"
            class=" md:w-auto btn btn-primary transition-all duration-300 ease-in-out"
          >
            Read the FAQ
          </a>
        </div>
        <div>
          <a
            href="{PUBLIC_STATIC_URL}/assets/champagne-room-white-paper.pdf"
            class=" md:w-auto btn btn-secondary transition-all duration-300 ease-in-out m-0"
            target="_blank"
          >
            Checkout the White Paper
          </a>
        </div>
      </div>
    </div>
    <div class="w-full p-10">
      <div class="w-auto">
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
</div>
<About />
<GetStarted />
<FAQ />
<SignUp {form} />

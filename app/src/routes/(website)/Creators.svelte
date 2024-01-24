<script lang="ts">
  import config from '$lib/config';
  import { Image } from '@unpic/svelte';
</script>

<div id="Creators" class="container mx-auto px-4 sm:px-6 md:px-10">
  <div class="pt-20">
    <h2
      class="text-primary font-bold text-[32px] lg:text-[41px] text-center font-CaviarDreams mb-10"
    >
      Become a Creator
    </h2>
    <div class="flex flex-col lg:flex-row items-center justify-center">
      <div class="w-full lg:w-1/2 my-10 flex justify-center p-4">
        <Image
          src="{config.PATH.staticUrl}/assets/creator.png"
          alt="Creator"
          class="rounded-xl overflow-hidden shadow-[0px_0px_17px_6px_#e779c1] max-w-xs md:max-w-sm lg:max-w-md"
          height={823}
          width={629}
        />
      </div>
      <div class="w-full lg:w-1/2 font-medium">
        <h2
          class="text-info text-center font-bold text-3xl lg:text-[41px] mb-6 font-CaviarDreams"
        >
          Benefits
        </h2>
        <ul class="text-lg font-medium list-disc mx-5 md:mx-10 space-y-4">
          <li>Get paid quickly in your local currency.</li>
          <li>
            Easily handle payments without worrying about issues and
            restrictions.
          </li>
          <li>
            Be safe and keep your info private—no need for names or phone
            numbers.
          </li>
          <li>Get tips from your fans.</li>
          <li>Sell custom content to your followers.</li>
          <li>
            Connect with well-to-do customers worldwide, regardless of your
            location.
          </li>
        </ul>
        <a
          class="text-info text-lg md:text-xl font-bold capitalize text-center block font-CaviarDreams mt-5 mb-4"
          href={config.PATH.creatorSignup}
        >
          Sign Up as a Creator
        </a>
        <ul class="text-base md:text-lg list-disc mx-5 md:mx-10">
          <!-- List items here -->
        </ul>
      </div>
    </div>
  </div>
</div>

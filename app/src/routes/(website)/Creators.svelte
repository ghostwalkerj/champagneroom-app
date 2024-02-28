<script lang="ts">
  import config from '$lib/config';
  import { Image } from '@unpic/svelte';
</script>

<div id="Creators" class="container mx-auto px-4 sm:px-6 md:px-10">
  <div class="pt-20">
    <h2
      class="mb-10 text-center font-CaviarDreams text-[32px] font-bold text-primary lg:text-[41px]"
    >
      Become a Creator
    </h2>
    <div class="flex flex-col items-center justify-center lg:flex-row">
      <div class="my-10 flex w-full justify-center p-4 lg:w-1/2">
        <Image
          src="{config.PATH.staticUrl}/assets/creator.png"
          alt="Creator"
          class="max-w-xs overflow-hidden rounded-xl shadow-[0px_0px_17px_6px_#e779c1] md:max-w-sm lg:max-w-md"
          height={823}
          width={629}
        />
      </div>
      <div class="w-full font-medium lg:w-1/2">
        <h2
          class="mb-6 text-center font-CaviarDreams text-3xl font-bold text-info lg:text-[41px]"
        >
          Benefits
        </h2>
        <ul class="mx-5 list-disc space-y-4 text-lg font-medium md:mx-10">
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
          class="mb-4 mt-5 block text-center font-CaviarDreams text-lg font-bold capitalize text-info md:text-xl"
          href={config.PATH.creatorSignup}
        >
          Sign Up as a Creator
        </a>
        <ul class="mx-5 list-disc text-base md:mx-10 md:text-lg">
          <!-- List items here -->
        </ul>
      </div>
    </div>
  </div>
</div>

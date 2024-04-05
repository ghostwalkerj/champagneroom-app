<script lang="ts">
  import { Image } from '@unpic/svelte';

  import config from '$lib/config';
</script>

<div id="Token" class="container mx-auto pt-20">
  <h2
    class="mb-10 text-center font-CaviarDreams text-[32px] font-bold text-primary lg:text-[41px]"
  >
    CHAMPAGNE ROOM Token
  </h2>
</div>

<div class="flex gap-4" id="page1">
  <div class="mx-auto flex flex-col items-center lg:flex-row">
    <div class="w-full px-4">
      <h2
        class="mb-6 text-center font-CaviarDreams text-3xl font-bold leading-none text-info lg:text-left lg:text-[41px]"
      >
        CRT Tokenomics
      </h2>
      <ul class="list-inside list-disc text-lg font-medium">
        CRT is an ECR-20 utility token that benefits users of Champagne Room by
        offering rebates when using the token in our ecosystem.<br /><br />
        As adoption for Champagne Room increases, so does demand for CRT.<br
        /><br />
        CRT is a small cap utility token with a total fixed supply of 100 million
        tokens.
      </ul>
    </div>
    <div class="p-6 pt-10">
      <div class="max-w-4xl">
        <Image
          class="overflow-hidden rounded-xl opacity-80 shadow-[0px_0px_17px_6px_#e779c1]"
          src="{config.PATH.staticUrl}/assets/champagneroomtoken.gif"
          width={960}
          height={540}
        />
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import Config from '$lib/models/config';
  import { Image } from '@unpic/svelte';
</script>

<div id="Token" class="container mx-auto pt-20">
  <h2
    class="text-primary font-bold text-[32px] lg:text-[41px] text-center font-CaviarDreams mb-10"
  >
    CHAMPAGNE ROOM Token
  </h2>
</div>

<div class="flex gap-4" id="page1">
  <div class="mx-auto flex flex-col lg:flex-row items-center">
    <div class="w-full px-4">
      <h2
        class="text-info text-center font-bold leading-none text-3xl lg:text-[41px] lg:text-left mb-6 font-CaviarDreams"
      >
        CRT Tokenomics
      </h2>
      <ul class="text-lg font-medium list-disc list-inside">
        CRT is an ECR-20 utility token that benefits users of Champagne Room by
        offering rebates when using the token in our ecosystem.<br /><br />
        As adoption for Champagne Room increases, so does demand for CRT.<br
        /><br />
        CRT is a small cap utility token with a total fixed supply of 100 million
        tokens.
      </ul>
    </div>
    <div class="pt-10 p-6">
      <div class="max-w-4xl">
        <Image
          class="opacity-80 rounded-xl overflow-hidden shadow-[0px_0px_17px_6px_#e779c1]"
          src="{Config.PATH.staticUrl}/assets/champagneroomtoken.gif"
          width={960}
          height={540}
        />
      </div>
    </div>
  </div>
</div>

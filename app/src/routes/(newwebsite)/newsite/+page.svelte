<script lang="ts">
  import About from '$components/About.svelte';
  import Earn from '$components/Earn.svelte';
  import Findus from '$components/Findus.svelte';
  import Play from '$components/Play.svelte';
  import Tokenomics from '$components/Tokenomics.svelte';
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
        The Best Auto-Staking &amp; Auto-Compounding Protocol in Crypto
      </h2>
      <ul
        class="mt-20 text-[#d0dce8de] text-[25px] font-medium text-lg list-disc list-inside"
      >
        <li class="mt-2">Highest Fixed APY – 102,483%</li>
        <li class="mt-2">
          First Automatic Staking and Compounding in Your Wallet!
        </li>
        <li class="mt-2">Get Rewards Every 30 Minutes / 48 Times Daily!</li>
      </ul>
      <div class="flex flex-col md:flex-row mt-10 sm:block">
        <button
          class="relative z-0 inline-block px-5 py-4 w-48 border border-[#28e0b28c] rounded-xl bg-[#28e0b28c] text-white text-center text-base font-semibold transition-all duration-300 ease-in-out font-space-grotesk mt-4 hover:border-[#206b58] hover:bg-[#28e0b2] m-auto md:mr-4"
        >
          Buy $Titano
        </button>
        <button
          class="relative z-0 inline-block px-5 py-4 w-48 border border-[#ff4fb487] rounded-xl bg-[#ff4fb487] text-white text-center text-base font-semibold transition-all duration-300 ease-in-out font-space-[grotesk] mt-4 hover:border-[#9e326f] hover:bg-[#ff4fb4] m-auto sm:ml-28"
        >
          White Paper
        </button>
      </div>
    </div>
    <div class="w-full mt-5 sm:w-1/3 sm:mt-0">
      <img alt="abc" src="/orbit.gif" class="gif rounded-[75px]" />
    </div>
  </div>
</div>
<About />
<Play />
<Earn />
<Tokenomics />
<Findus />

<script lang="ts">
import ConnectButton from '$components/header/ConnectButton.svelte';
  import Config from '$lib/config';
  import {selectedAccount} from '$lib/web3';
</script>


<section class="flex justify-center h-[70vh]">
{#if $selectedAccount}
  <div class="flex flex-col gap-10  max-w-6xl h-full">


    <h1 class="text-3xl font-semibold uppercase text-center">Join our community</h1>


  
    <div class="flex sm:flex-row flex-col gap-4 justify-evenly p-4 h-full">
  
      
      <a href={Config.Path.creatorSignup} class="bg-[url('/images/creator2.png')] min-w-xs bg-image group h-full rounded-lg">
        <div class="group-hover:bg-opacity-0 transition ease-in-out delay-150  p-4 gap-3  h-full bottom-0 left-0 right-0 bg-black flex flex-col justify-end bg-opacity-20 text-white text-center bg-gradient-to-t from-black to-[rgba(0,0,0,0)]">
          <h2 class="text-2xl flex justify-center items-center gap-2">As a Creator <iconify-icon icon="solar:arrow-up-linear" class="mt-1" rotate="90deg"></iconify-icon></h2>
          <p class="whitespace-nowrap"><iconify-icon width="24" class="text-primary -mb-1" icon="mdi:money-100"></iconify-icon> Earn money by selling your content</p>
        </div>
      </a>

      <a href={Config.Path.agentSignup} class="bg-[url('/images/agent2.png')] bg-image min-w-xs group h-full rounded-lg">
        <div class="group-hover:bg-opacity-0 transition ease-in-out delay-150  p-4 gap-3 h-full bottom-0 left-0 right-0 bg-black flex flex-col justify-end bg-opacity-20 text-white text-center bg-gradient-to-t from-black to-[rgba(0,0,0,0)]">
          <h2 class="text-2xl flex justify-center items-center gap-2">As an Agent <iconify-icon icon="solar:arrow-up-linear" class="mt-1" rotate="90deg"></iconify-icon></h2>
          <p class="whitespace-nowrap"><iconify-icon class="text-secondary -mb-1" width="20" icon="bi:coin"></iconify-icon> Earn commissions from your creators</p>
        </div>
      </a>
    </div>
  
  </div>
{:else}
<div class="mt-48">
  <ConnectButton />
</div>

{/if}
</section>
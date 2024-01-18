<script lang="ts">
  import ConnectButton from '$components/header/ConnectButton.svelte';
  import config from '$lib/config';
  import { selectedAccount } from '$lib/web3';
  import Icon from '@iconify/svelte';
</script>

<section class="flex justify-center h-[70vh]">
  {#if $selectedAccount}
    <div class="flex flex-col gap-10 max-w-6xl h-full">
      <h1 class="text-3xl font-semibold uppercase text-center">
        Join our community
      </h1>

      <div class="flex sm:flex-row flex-col gap-4 justify-evenly p-4 h-full">
        <a
          href={config.PATH.creatorSignup}
          class="min-w-xs bg-image group h-full rounded-lg overflow-hidden"
          style="background-image: url({config.PATH
            .staticUrl}/assets/creator2.png)"
        >
          <div
            class="group-hover:bg-opacity-0 transition ease-in-out delay-150 p-4 gap-3 h-full bottom-0 left-0 right-0 bg-black flex flex-col justify-end bg-opacity-20 text-white text-center bg-gradient-to-t from-black to-[rgba(0,0,0,0)]"
          >
            <h2 class="text-2xl flex justify-center items-center gap-2">
              As a Creator <Icon
                icon="solar:arrow-up-linear"
                class="mt-1"
                rotate={90}
              />
            </h2>
            <p class="whitespace-nowrap">
              <Icon
                width="24"
                class="text-primary -mb-1"
                icon="mdi:money-100"
              /> Earn money by selling your content
            </p>
          </div>
        </a>

        <a
          href={config.PATH.agentSignup}
          class="min-w-xs bg-image group h-full rounded-lg overflow-hidden"
          style="background-image: url({config.PATH
            .staticUrl}/assets/agent2.png)"
        >
          <div
            class="group-hover:bg-opacity-0 transition ease-in-out delay-150 p-4 gap-3 h-full bottom-0 left-0 right-0 bg-black flex flex-col justify-end bg-opacity-20 text-white text-center bg-gradient-to-t from-black to-[rgba(0,0,0,0)]"
          >
            <h2 class="text-2xl flex justify-center items-center gap-2">
              As an Agent <Icon
                icon="solar:arrow-up-linear"
                class="mt-1"
                rotate={90}
              />
            </h2>
            <p class="whitespace-nowrap">
              <Icon class="text-secondary -mb-1" width="20" icon="bi:coin" /> Earn
              commissions from your creators
            </p>
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

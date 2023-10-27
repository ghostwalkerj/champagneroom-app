<script lang="ts">
  import { onMount } from 'svelte';

  import { defaultWallet } from '$lib/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  let hasNoWallet = false;

  onMount(async () => {
    defaultWallet.subscribe((_wallet) => {
      hasNoWallet = _wallet ? false : true;
    });
  });
</script>

<div class="w-screen bg-base flex flex-col p-6 text-center">
  <div class="font-bold text-5xl text-primary w-full">
    Crypto Wallet Authentication
  </div>
  {#if hasNoWallet}
    <div class="py-6 w-full">Please connect a wallet to continue</div>
  {/if}
  <div>
    <ConnectButton />
  </div>
</div>

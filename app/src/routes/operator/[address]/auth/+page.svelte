<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';

  import { defaultWallet, selectedAccount } from '$lib/util/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  const signingMessage = data.signingMessage;

  onMount(async () => {
    selectedAccount.subscribe(async (account) => {
      if (account && $defaultWallet && account) {
        const address = account.address;
        try {
          const signature = await $defaultWallet.provider.request({
            method: 'personal_sign',
            params: [signingMessage, address]
          });
          console.log(signature);
        } catch (error) {
          console.log(error);
          goto('/');
        }
      }
    });
  });
</script>

<div class="min-h-screen-md bg-base-100 hero">
  <div class="text-center hero-content">
    <div class="max-w-md">
      <h1 class="font-bold text-5xl">Welcome to Champagne Room</h1>
      <p class="pt-6">
        Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit
        eam ad opus nunc et adepto a pCall!
      </p>
      <ConnectButton />
    </div>
  </div>
</div>

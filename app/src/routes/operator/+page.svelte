<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { selectedAccount } from '$lib/util/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  onMount(() => {
    selectedAccount.subscribe(async (account) => {
      if (account) {
        const operatorPath = urlJoin($page.url.href, account.address);
        goto(operatorPath);
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

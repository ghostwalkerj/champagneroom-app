<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_CREATOR_PATH } from '$env/static/public';

  import { selectedAccount } from '$lib/util/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  let hasNoWallet = false;

  onMount(() => {
    const creatorBasePath = urlJoin(
      window.location.origin,
      PUBLIC_CREATOR_PATH
    );

    selectedAccount.subscribe(async (account) => {
      if (account) {
        hasNoWallet = false;
        const creatorFullPath = urlJoin(creatorBasePath, account.address);
        if ($page.url.href === creatorBasePath) {
          goto(creatorFullPath);
        }
      } else {
        hasNoWallet = true;
      }
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

<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_OPERATOR_PATH } from '$env/static/public';

  import { defaultWallet } from '$lib/util/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  const message = data.message;

  const setAuth = async (address: string, signature: string) => {
    const operatorFullPath = urlJoin(
      window.location.origin,
      PUBLIC_OPERATOR_PATH,
      address
    );
    let formData = new FormData();
    formData.append('signature', signature);
    await fetch($page.url.href + '?/auth', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });
    goto(operatorFullPath);
  };

  onMount(async () => {
    const wallet = $defaultWallet;
    if (wallet) {
      const address = wallet.accounts[0].address;
      if (
        $defaultWallet &&
        address.toLowerCase() === $page.params.address.toLowerCase()
      ) {
        try {
          const signature = await $defaultWallet.provider.request({
            method: 'personal_sign',
            params: [message, address]
          });
          await setAuth(address, signature);
        } catch (error) {
          console.log(error);
          goto('/');
        }
      }
    } else {
      goto('/');
    }
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

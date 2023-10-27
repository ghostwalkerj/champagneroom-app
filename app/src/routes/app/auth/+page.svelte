<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import { onMount } from 'svelte';

  import { deserialize } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { AuthType } from '$lib/models/user';

  import { defaultWallet } from '$lib/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  let { message, address, returnPath, authType } = data;

  const redirectPath = returnPath ?? '/';
  $: hasNoWallet = false;
  let hasAddressMismatch = false;
  let isUniqueKeyAuth = false;
  let isSigningAuth = false;

  const setSigningAuth = async (
    message: string,
    signature: string,
    returnPath: string
  ) => {
    let formData = new FormData();
    formData.append('signature', signature);
    formData.append('address', address!);
    formData.append('message', message);
    formData.append('returnPath', returnPath);

    await fetch($page.url.href + '?/signing_auth', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });
  };

  const setUniqueKeyAuth = async (returnPath: string) => {
    let formData = new FormData();
    formData.append('address', address!);
    formData.append('returnPath', returnPath);

    await fetch($page.url.href + '?/unique_key_auth', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });
  };

  switch (authType) {
    case AuthType.UNIQUE_KEY: {
      isUniqueKeyAuth = true;
      break;
    }

    case AuthType.SIGNING: {
      isSigningAuth = true;
      break;
    }
  }

  onMount(async () => {
    if (isUniqueKeyAuth) {
      await setUniqueKeyAuth(redirectPath);
      goto(redirectPath);
    }

    // Signing Auth Flow
    // Check if wallet is connected
    // If not, ask to connect
    // If connected, check if wallet address matches
    // If not, ask to connect wallet with correct address
    if (isSigningAuth) {
      let walletAddress = '';
      defaultWallet.subscribe(async (wallet) => {
        hasNoWallet = wallet === undefined;
        if (wallet && walletAddress !== wallet.accounts[0].address) {
          walletAddress = wallet.accounts[0].address;
          hasAddressMismatch =
            address !== undefined &&
            walletAddress.toLowerCase() !== address.toLowerCase();
          if (!address) {
            // This means they came to auth page without an address field
            // Need to check the backed for a user with this address
            // Then create message
            let formData = new FormData();
            formData.append('address', walletAddress);
            const response = await fetch('?/get_signing_message', {
              method: 'POST',
              body: formData
            });
            const result: ActionResult = deserialize(await response.text());

            // eslint-disable-next-line unicorn/consistent-destructuring
            message = result.data.message;
            console.log('message:', message);
            address = walletAddress;
          }

          const signature = await wallet.provider.request({
            method: 'personal_sign',
            params: [message, walletAddress]
          });
          await setSigningAuth(message, signature, redirectPath);
          goto(redirectPath);
        }
      });
    }
  });
</script>

<div class="w-screen bg-base flex flex-col p-6 text-center">
  <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
    Crypto Wallet Authentication
  </div>
  {#if hasNoWallet}
    <div class="py-6 w-full">Please connect a wallet to continue</div>
  {:else if hasAddressMismatch}
    <div class="py-6">
      Please connect a wallet with the address {address} to continue
    </div>
  {/if}
  <div>
    <ConnectButton />
  </div>
</div>

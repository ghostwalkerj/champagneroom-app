<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    PUBLIC_AGENT_PATH,
    PUBLIC_CREATOR_PATH,
    PUBLIC_OPERATOR_PATH
  } from '$env/static/public';

  import { AuthType } from '$lib/models/common';

  import { EntityType } from '$lib/constants';
  import { defaultWallet } from '$lib/util/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  const { message, role, user, address, tokenName } = data;

  const defaultReturn = '/app';
  let hasNoWallet = false;
  let hasAddressMismatch = false;

  if (!user) {
    // Ask to sign up
    console.log('User not found');
    goto(defaultReturn);
  }

  const setSigningAuth = async (message: string, signature: string) => {
    let formData = new FormData();
    formData.append('signature', signature);
    formData.append('tokenName', tokenName);
    formData.append('address', address);
    formData.append('role', role);
    formData.append('message', message);

    await fetch($page.url.href + '?/signing_auth', {
      method: 'POST',
      body: formData
    });
  };

  const setUniqueKeyAuth = async () => {
    let formData = new FormData();
    formData.append('tokenName', tokenName);
    formData.append('address', address);

    await fetch($page.url.href + '?/unique_key_auth', {
      method: 'POST',
      body: formData
    });
  };

  onMount(async () => {
    let returnPath = '/app';
    switch (role) {
      case EntityType.CREATOR: {
        returnPath = urlJoin(PUBLIC_CREATOR_PATH, address);
        break;
      }
      case EntityType.OPERATOR: {
        returnPath = urlJoin(PUBLIC_OPERATOR_PATH, address);
        break;
      }
      case EntityType.AGENT: {
        returnPath = urlJoin(PUBLIC_AGENT_PATH, address);
        break;
      }
      default: {
        break;
      }
    }
    switch (user.authType) {
      case AuthType.UNIQUE_KEY: {
        setUniqueKeyAuth();
        goto(returnPath);
        break;
      }

      case AuthType.SIGNING: {
        // Signing Auth Flow
        // Check if wallet is connected
        // If not, ask to connect
        // If connected, check if wallet address matches
        // If not, ask to connect wallet with correct address
        defaultWallet.subscribe(async (wallet) => {
          if (wallet) {
            hasNoWallet = false;
            const walletAddress = wallet.accounts[0].address;
            if (walletAddress.toLowerCase() === address.toLowerCase()) {
              hasAddressMismatch = false;
              try {
                const signature = await wallet.provider.request({
                  method: 'personal_sign',
                  params: [message, walletAddress]
                });
                await setSigningAuth(message, signature);
                goto(returnPath);
              } catch (error) {
                console.log(error);
                goto(defaultReturn);
              }
            } else {
              hasAddressMismatch = true;
            }
          } else {
            hasNoWallet = true;
          }
        });
        break;
      }
      default: {
        goto(defaultReturn);
        break;
      }
    }
  });
</script>

<div class="min-h-screen-md bg-base hero">
  <div class="text-center hero-content">
    <div class="max-w-md">
      <h1 class="font-bold text-5xl">Welcome to Champagne Room</h1>
      {#if hasNoWallet}
        <p class="pt-6">Please connect a wallet to continue.</p>
        <ConnectButton />
      {:else if hasAddressMismatch}
        <p class="pt-6">
          Please connect a wallet with the address {address} to continue.
        </p>
      {/if}
    </div>
  </div>
</div>

<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import type { WalletState } from '@web3-onboard/core';
  import { onMount } from 'svelte';

  import { deserialize } from '$app/forms';
  import { goto } from '$app/navigation';
  import { navigating, page } from '$app/stores';
  import { PUBLIC_WEBSITE_URL } from '$env/static/public';

  import { AuthType } from '$lib/constants';
  import { defaultWallet } from '$lib/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  let { returnPath, authType, parseId } = data;

  const redirectPath = returnPath ?? PUBLIC_WEBSITE_URL;
  $: hasNoWallet = false;
  $: signingRejected = false;
  let wallet: WalletState;

  let walletAddress = '';
  let message = '';

  const applyAction = (result: ActionResult) => {
    switch (result.type) {
      case 'error': {
        goto('/');
        break;
      }
      case 'redirect': {
        goto(result.location);
        break;
      }
      case 'success': {
        goto(returnPath);
        break;
      }
    }
  };

  const setSigningAuth = async (
    message: string,
    signature: string,
    address: string
  ) => {
    let formData = new FormData();
    formData.append('signature', signature);
    formData.append('address', address);
    formData.append('message', message);

    const response = await fetch('?/signing_auth', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });

    const result: ActionResult = deserialize(await response.text());
    applyAction(result);
    goto(redirectPath, { replaceState: true });
  };

  const setPasswordAuth = async () => {
    let formData = new FormData();
    formData.append('parseId', parseId!);

    const response = await fetch('?/password_secret_auth', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });

    const result: ActionResult = deserialize(await response.text());
    applyAction(result);
    goto(redirectPath, { replaceState: true });
  };

  const setPinAuth = async () => {
    const response = await fetch('?/pin_auth', {
      method: 'POST',
      body: new FormData(),
      redirect: 'follow'
    });

    const result: ActionResult = deserialize(await response.text());
    applyAction(result);
    goto(redirectPath, { replaceState: true });
  };

  const signMessage = async () => {
    try {
      walletAddress = wallet.accounts[0].address;
      let formData = new FormData();
      formData.append('address', walletAddress);
      const response = await fetch('?/get_signing_message', {
        method: 'POST',
        body: formData
      });
      const result: ActionResult = deserialize(await response.text());

      if (result.type === 'success' && result.data) {
        message = result.data.message;

        const signature = (await wallet.provider.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        })) as string;
        await setSigningAuth(message, signature, walletAddress);
      }
    } catch {
      signingRejected = true;
    }
  };

  onMount(async () => {
    switch (authType) {
      case AuthType.PATH_PASSWORD: {
        setPasswordAuth();
        break;
      }

      case AuthType.SIGNING: {
        defaultWallet.subscribe(async (_wallet) => {
          hasNoWallet = _wallet === undefined;
          if (_wallet && walletAddress !== _wallet.accounts[0].address) {
            wallet = _wallet;
            signMessage();
          }
        });
        break;
      }

      case AuthType.PIN: {
        setPinAuth();
        break;
      }
      default: {
        break;
      }
    }
  });
</script>

<div class="w-screen bg-base flex flex-col p-6 text-center">
  {#if authType === AuthType.SIGNING}
    <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
      Crypto Wallet Authentication
    </div>
    <div class="py-6 w-full">
      Please sign the message in your wallet to verify your identity
    </div>
    {#if hasNoWallet}
      <div class="py-6 w-full">Please connect a wallet to continue</div>
    {/if}
    {#if signingRejected}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div>
        <div class="btn btn-primary" on:click={signMessage}>Sign Message</div>
      </div>
    {/if}
    <div>
      <ConnectButton />
    </div>
  {:else if authType === AuthType.PATH_PASSWORD}
    <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
      Verifying Path
    </div>
  {:else if authType === AuthType.PIN}
    <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
      Verifying PIN
    </div>
  {/if}
</div>

<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import { onMount } from 'svelte';

  import { deserialize } from '$app/forms';
  import { goto } from '$app/navigation';
  import { PUBLIC_WEBSITE_URL } from '$env/static/public';

  import { AuthType } from '$lib/models/user';

  import { defaultWallet } from '$lib/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  let { returnPath, authType, secret, slug } = data;

  const redirectPath = returnPath ?? PUBLIC_WEBSITE_URL;
  $: hasNoWallet = false;

  const setSigningAuth = async (
    message: string,
    signature: string,
    returnPath: string,
    address: string
  ) => {
    let formData = new FormData();
    formData.append('signature', signature);
    formData.append('address', address);
    formData.append('message', message);
    formData.append('returnPath', returnPath);

    const resp = await fetch('?/signing_auth', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });
  };

  const setPasswordAuth = async (returnPath: string) => {
    let formData = new FormData();
    formData.append('secret', secret!);
    formData.append('slug', slug!);

    const response = await fetch('?/password_secret_auth', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });

    const result: ActionResult = deserialize(await response.text());
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

  const setPinAuth = async (returnPath: string) => {
    const response = await fetch('?/pin_auth', {
      method: 'POST',
      body: new FormData(),
      redirect: 'follow'
    });

    const result: ActionResult = deserialize(await response.text());
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

  onMount(async () => {
    switch (authType) {
      case AuthType.PASSWORD_SECRET: {
        setPasswordAuth(redirectPath);
        break;
      }

      case AuthType.SIGNING: {
        let walletAddress = '';
        defaultWallet.subscribe(async (wallet) => {
          hasNoWallet = wallet === undefined;
          if (wallet && walletAddress !== wallet.accounts[0].address) {
            walletAddress = wallet.accounts[0].address;
            let formData = new FormData();
            formData.append('address', walletAddress);
            const response = await fetch('?/get_signing_message', {
              method: 'POST',
              body: formData
            });
            const result: ActionResult = deserialize(await response.text());

            switch (result.type) {
              case 'success': {
                if (result.data) {
                  const message = result.data.message;
                  const address = walletAddress;
                  const signature = (await wallet.provider.request({
                    method: 'personal_sign',
                    params: [message, walletAddress]
                  })) as string;
                  await setSigningAuth(
                    message,
                    signature,
                    redirectPath,
                    address
                  );
                  goto(redirectPath);
                }
                break;
              }
              case 'error': {
                break;
              }
              case 'redirect': {
                goto(result.location);
                break;
              }
              default: {
                break;
              }
            }
          }
        });
        break;
      }

      case AuthType.PIN: {
        setPinAuth(redirectPath);
        break;
      }
      default: {
        break;
      }
    }
  });
</script>

<div class="w-screen bg-base flex flex-col p-6 text-center">
  <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
    Crypto Wallet Authentication
  </div>
  {#if hasNoWallet}
    <div class="py-6 w-full">Please connect a wallet to continue</div>
  {/if}
  <div>
    <ConnectButton />
  </div>
</div>

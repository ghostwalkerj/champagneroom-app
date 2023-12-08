<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import type { WalletState } from '@web3-onboard/core';
  import { onDestroy, onMount } from 'svelte';

  import { applyAction, deserialize, enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  import Config from '$lib/config';
  import { AuthType } from '$lib/constants';
  import { defaultWallet, selectedAccount } from '$lib/web3';

  import type { Unsubscriber } from 'svelte/store';
  import type { ActionData, PageData } from './$types';
  import NeonBlur from '$components/NeonBlur.svelte';

  export let data: PageData;
  export let form: ActionData;

  let { returnPath, authType, parseId, type } = data;

  $: hasNoWallet = false;
  $: signingRejected = false;
  $: noUser = false;
  let wallet: WalletState;
  let walletUnsub: Unsubscriber;
  let accountUnsub: Unsubscriber;

  let walletAddress = '';
  let message = '';

  const onSubmit = () => {
    return async ({ result }) => {
      authAction(result);
      applyAction(result);
    };
  };

  const authAction = (result: ActionResult) => {
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
        goto(returnPath!, { replaceState: true });
        break;
      }
      case 'failure': {
        if (result.data && result.data.userNotFound) {
          noUser = true;
        }
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
    authAction(result);
  };

  const signMessage = async () => {
    try {
      noUser = false;
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
        try {
          await setSigningAuth(message, signature, walletAddress);
        } catch {}
      } else if (
        result.type === 'failure' &&
        result.data &&
        result.data.userNotFound
      ) {
        noUser = true;
      }
    } catch {
      signingRejected = true;
    }
  };

  onMount(async () => {
    switch (authType) {
      case AuthType.SIGNING: {
        walletUnsub = defaultWallet.subscribe(async (_wallet) => {
          hasNoWallet = _wallet === undefined;
          if (_wallet) {
            wallet = _wallet;
          }
        });
        accountUnsub = selectedAccount.subscribe((account) => {
          if (account) {
            if (walletAddress !== account.address) {
              walletAddress = account.address;
              signMessage();
            }
          }
        });
        break;
      }

      default: {
        break;
      }
    }
  });

  onDestroy(() => {
    walletUnsub?.();
    accountUnsub?.();
  });

</script>

<div class="w-screen  flex flex-col text-center items-center">
  
  {#if authType === AuthType.SIGNING}
    <div
      class="bg-surface-800 p-6 rounded-lg font-Roboto flex flex-col items-center justify-center min-w-[320px] gap-4"
    >
      <div
        class="text-4xl font-bold w-full max-w-lg mx-auto text-center"
      >
        Crypto Wallet Authentication
      </div>

      {#if noUser}
        <div
          class="w-full lg:w-96 border border-surface-600 p-4 lg:mt-10 rounded-lg"
        >
          <div class="items-center text-center">
            <h2 class="font-semibold text-xl">
              Address: {walletAddress?.slice(0, 6)}...{walletAddress.slice(-4)} not
              found
            </h2>
            <p>This address is not registered. Please signup to continue.</p>
          </div>
        </div>
      {:else}
        <div
          class="text-md text-neutral w-full max-w-md mx-auto text-center mb-4"
        >
          Please sign the message in your wallet to verify your identity
        </div>

        {#if hasNoWallet}
          <div class="py-6 w-full lg:w-auto">
            Please connect a wallet to continue
          </div>
        {/if}
        {#if signingRejected}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div>
            <div class="daisy-btn daisy-btn-primary" on:click={signMessage}>
              Sign Message
            </div>
          </div>
        {/if}
      {/if}
      <div class="w-full max-w-md border-t border-surface-600 mt-2">
      </div>
      <div
        class="text-xl font-bold  w-full max-w-md mx-auto text-center mb-4"
      >
      Not a user? Sign Up to Earn Now
      </div>
      <NeonBlur>
        <a
          href={Config.Path.signup}
          class="relative btn btn-lg variant-filled rounded-lg"
        >
          Sign Up
        </a>
      </NeonBlur>
    </div>


  {:else if authType === AuthType.PATH_PASSWORD}
    <!-- <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
      Verifying Path
    </div> -->


            <form
              method="post"
              action="?/password_secret_auth"
              use:enhance={onSubmit}
              class="bg-surface-800 p-6 rounded-lg flex flex-col  min-w-[320px] gap-4"
            >
              <input type="hidden" name="parseId" value={parseId} />
              <input type="hidden" name="type" value={type} />
                  
                  <label class="label text-left font-semibold">
                    <span>Password</span>
                    <input class="input variant-form-material bg-surface-700" name="password" type="password" />
                  </label>

                  <div >                   
                    {#if form?.missingPassword}<div
                        class="shadow-lg daisy-alert daisy-alert-error"
                      >
                        Password is required
                      </div>
                      {/if}

                    {#if form?.badPassword}<div
                        class="shadow-lg daisy-alert daisy-alert-error"
                      >
                        Incorrect Password
                      </div>
                      {/if}

                    <div class="text-sm text-left">
                      Please enter your password
                    </div>

                  </div>
              
                <div class="text-center">
                  <button class="btn variant-filled-primary" type="submit"
                    >Submit</button
                  >

            </form>

  {:else if authType === AuthType.PIN}
    <!-- <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
      Verifying PIN
    </div> -->


            <form method="post" action="?/pin_auth" use:enhance={onSubmit}
              class="bg-surface-800 p-6 rounded-lg flex flex-col  min-w-[320px] gap-4"
            >
              <input type="hidden" name="parseId" value={parseId} />
              <input type="hidden" name="type" value={type} />

                  <label for="pin" class="label text-left">
                    <span class="font-semibold">8 Digit Pin</span>
                    <input
                      name="pin"
                      type="text"
                      class="input variant-form-material bg-surface-700"
                      value={form?.pin ?? ''}
                      minlength="8"
                      maxlength="8"
                    />
                    </label
                  >
                    
                    {#if form?.missingPin}<div
                        class="shadow-lg daisy-alert daisy-alert-error"
                      >
                        Pin is required
                      </div>{/if}
                    {#if form?.invalidPin}<div
                        class="shadow-lg daisy-alert daisy-alert-error"
                      >
                        Pin must be 8 digits
                      </div>{/if}
                    {#if form?.badPin}<div
                        class="shadow-lg daisy-alert daisy-alert-error"
                      >
                        Incorrect Pin
                      </div>{/if}
                    <div class="text-left text-sm">
                      You need a pin to see this ticket
                    </div>
              

                <div class="text-center">
                  <button class="btn variant-filled-primary" type="submit"
                    >Submit</button
                  >
                </div>
            </form>

  {/if}
</div>

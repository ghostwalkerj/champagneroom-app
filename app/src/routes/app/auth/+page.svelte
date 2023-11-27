<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import type { WalletState } from '@web3-onboard/core';
  import { onMount } from 'svelte';

  import { applyAction, deserialize, enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  import Config from '$lib/config';
  import { AuthType } from '$lib/constants';
  import { defaultWallet } from '$lib/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let { returnPath, authType, parseId, type } = data;

  $: hasNoWallet = false;
  $: signingRejected = false;
  $: noUser = false;
  let wallet: WalletState;

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
        try {
          await setSigningAuth(message, signature, walletAddress);
        } catch {
          signingRejected = true;
        }
      } else if (
        result.type === 'failure' &&
        result.data &&
        result.data.userNotFound
      ) {
        noUser = true;
      }
    } catch {}
  };

  onMount(async () => {
    switch (authType) {
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

      default: {
        break;
      }
    }
  });
</script>

<div class="w-screen bg-base flex flex-col p-6 text-center items-center">
  {#if noUser && authType === AuthType.SIGNING}
    <div
      class="card w-full lg:w-96 bg-neutral text-neutral-content m-4 lg:m-10"
    >
      <div class="card-body items-center text-center">
        <h2 class="card-title">
          Address: {walletAddress?.slice(0, 6)}...{walletAddress.slice(-4)} not found
        </h2>
        <p>
          This address is not registered with us. Please signup to continue.
        </p>
        <div class="card-actions justify-end">
          <button
            class="btn btn-primary"
            on:click={() => {
              goto(Config.Path.signup, { replaceState: true });
            }}>Signup</button
          >
          <button
            class="btn btn-ghost"
            on:click={() => {
              goto('/');
            }}>Cancel</button
          >
        </div>
      </div>
    </div>
  {:else if authType === AuthType.SIGNING}
    <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
      Crypto Wallet Authentication
    </div>
    <div class="py-6 w-full lg:w-auto">
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
        <div class="btn btn-primary" on:click={signMessage}>Sign Message</div>
      </div>
    {/if}
    <div>
      <ConnectButton />
    </div>
  {:else if authType === AuthType.PATH_PASSWORD}
    <!-- <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
      Verifying Path
    </div> -->

    <div class="mt-6 flex items-center">
      <div class="w-full">
        <div class="flex justify-center">
          <div
            class="flex flex-col w-full p-4 max-w-fit gap-4 rounded-xl bg-base-200 overflow-auto"
          >
            <form
              method="post"
              action="?/password_secret_auth"
              use:enhance={onSubmit}
            >
              <input type="hidden" name="parseId" value={parseId} />
              <input type="hidden" name="type" value={type} />
              <div class="max-w-xs w-full py-2 form-control">
                <div class="max-w-xs w-full py-2 form-control">
                  <label for="pin" class="label">
                    <span class="label-text">Password</span></label
                  >
                  <div class="rounded-md shadow-sm mt-1 relative">
                    <input
                      name="password"
                      type="password"
                      class="max-w-xs w-full py-2 pl-6 input input-bordered input-primary"
                      value={''}
                    />
                    {#if form?.missingPassword}<div
                        class="shadow-lg alert alert-error"
                      >
                        Password is required
                      </div>{/if}

                    {#if form?.badPassword}<div
                        class="shadow-lg alert alert-error"
                      >
                        Incorrect Password
                      </div>{/if}
                    <div class="text-center text-sm p-1">
                      Please enter your password
                    </div>
                  </div>
                </div>

                <div class="py-4 text-center">
                  <button class="btn btn-primary" type="submit">Submit</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  {:else if authType === AuthType.PIN}
    <!-- <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
      Verifying PIN
    </div> -->

    <div class="mt-6 flex items-center">
      <div class="w-full">
        <div class="flex justify-center">
          <div
            class="flex flex-col w-full p-4 max-w-fit gap-4 rounded-xl bg-base-200 overflow-auto"
          >
            <form method="post" action="?/pin_auth" use:enhance={onSubmit}>
              <input type="hidden" name="parseId" value={parseId} />
              <input type="hidden" name="type" value={type} />
              <div class="max-w-xs w-full py-2 form-control">
                <div class="max-w-xs w-full py-2 form-control">
                  <label for="pin" class="label">
                    <span class="label-text">8 Digit Pin</span></label
                  >
                  <div class="rounded-md shadow-sm mt-1 relative">
                    <input
                      name="pin"
                      type="text"
                      class="max-w-xs w-full py-2 pl-6 input input-bordered input-primary"
                      value={form?.pin ?? ''}
                      minlength="8"
                      maxlength="8"
                    />
                    {#if form?.missingPin}<div
                        class="shadow-lg alert alert-error"
                      >
                        Pin is required
                      </div>{/if}
                    {#if form?.invalidPin}<div
                        class="shadow-lg alert alert-error"
                      >
                        Pin must be 8 digits
                      </div>{/if}
                    {#if form?.badPin}<div class="shadow-lg alert alert-error">
                        Incorrect Pin
                      </div>{/if}
                    <div class="text-center text-sm p-1">
                      You need a pin to see this ticket
                    </div>
                  </div>
                </div>

                <div class="py-4 text-center">
                  <button class="btn btn-primary" type="submit">Submit</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

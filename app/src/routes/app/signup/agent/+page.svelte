<script lang="ts">
  import type { WalletState } from '@web3-onboard/core';
  import { onDestroy, onMount } from 'svelte';
  import { uniqueNamesGenerator } from 'unique-names-generator';

  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  import Config from '$lib/config';
  import { defaultWallet, selectedAccount } from '$lib/web3';
  import { womensNames } from '$lib/womensNames';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { Unsubscriber } from 'svelte/store';
  import type { ActionData, PageData } from './$types';
  import type { ActionResult } from '@sveltejs/kit';

  export let data: PageData;
  export let form: ActionData;

  const message = data.message;
  const user = data.user;
  const isAgent = data.isAgent;

  $: walletAddress = '';
  let wallet: WalletState | undefined;
  let walletUnsub: Unsubscriber;
  let accountUnsub: Unsubscriber;

  let addressModel: HTMLDialogElement;
  let signupModel: HTMLDialogElement;
  let existsModel: HTMLDialogElement;
  let profileImageUrl = Config.UI.defaultProfileImage;

  let exampleName = user
    ? user.name
    : uniqueNamesGenerator({
        dictionaries: [womensNames]
      });

  const useWallet = async () => {
    if (wallet) {
      if (
        user &&
        user.address &&
        user.address.toLowerCase() === walletAddress.toLowerCase() &&
        isAgent
      ) {
        existsModel?.showModal();
        addressModel?.close();
      } else {
        existsModel?.close();
        addressModel?.showModal();
      }
    } else {
      walletAddress = '';
      wallet = undefined;
    }
  };

  onMount(async () => {
    useWallet();

    walletUnsub = defaultWallet.subscribe((_wallet) => {
      if (_wallet) {
        wallet = _wallet;
        useWallet();
      }
    });
    accountUnsub = selectedAccount.subscribe((account) => {
      if (account) {
        walletAddress = account.address;
      }
    });
  });

  onDestroy(() => {
    walletUnsub?.();
    accountUnsub?.();
  });

  const onSubmit = async ({ formData }: { formData: FormData }) => {
    formData.append('profileImageUrl', profileImageUrl);
    formData.append('address', walletAddress);
    formData.append('message', message);

    if (wallet) {
      const signature = await wallet.provider.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });
      formData.append('signature', signature);
    }

    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'success') {
        goto(result.data!.returnPath);
      } else {
        if (result.type === 'failure' && result.data!.alreadyAgent) {
          existsModel.showModal();
          addressModel?.close();
          signupModel?.close();
        }
      }
      applyAction(result);
    };
  };
</script>

<div
  class="flex place-content-center w-full flex-col text-base-100 text-center"
>
  <h1 class="text-3xl font-bold mt-10 text-primary">
    Become an Agent and Earn with Your Creators
  </h1>

  {#if !wallet}
    <div class="text-primary font-bold mt-2">You Need a Crypto Wallet</div>
  {/if}
  <div />
</div>
<dialog id="address_modal" class="daisy-modal" bind:this={addressModel}>
  <form
    method="dialog"
    class="daisy-modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]
"
    action="?/null_action"
  >
    {#if wallet}
      <div>
        <div class="w-full flex flex-col place-content-center">
          <div class="w-full flex place-content-center">
            <img
              src="{Config.PATH.staticUrl}/assets/bottlesnlegs.png"
              alt="Logo"
              class="h-16"
            />
          </div>
        </div>
        <div class="font-medium text-primary text-2xl text-center">
          Sign up with this address
        </div>
        <div class="mt-4 font-medium text-accent text-md text-center">
          {walletAddress}
        </div>
        <div class="mt-4 font-medium text-secondary text-sm text-center">
          To use a different address, change the account connected in your
          wallet
        </div>
        <div class="daisy-modal-action place-content-center gap-10">
          <button
            class="daisy-btn daisy-btn-primary daisy-btn-outline"
            on:click={() => {
              addressModel.close();
              signupModel.showModal();
            }}>Continue</button
          >
          <button
            class="daisy-btn daisy-btn-secondary daisy-btn-outline"
            on:click={() => addressModel.close()}>Cancel</button
          >
        </div>
      </div>
    {:else}
      <div>
        <div class="w-full flex place-content-center">
          <img
            src="{Config.PATH.staticUrl}/assets/bottlesnlegs.png"
            alt="Logo"
            class="h-16"
          />
        </div>
        <div class="font-medium text-primary text-2xl text-center">
          Before you can sign up, connect your wallet
        </div>

        <div class="daisy-modal-action place-content-center gap-10">
          <ConnectButton />
          <button
            class="daisy-btn daisy-btn-secondary daisy-btn-outline"
            on:click={() => addressModel.close()}>Cancel</button
          >
        </div>
      </div>
    {/if}
  </form>
</dialog>

<dialog id="exist_model" class="daisy-modal" bind:this={existsModel}>
  <form
    method="dialog"
    class="daisy-modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]
"
    action="?/null_action"
  >
    {#if wallet}
      <div>
        <div class="w-full flex flex-col place-content-center">
          <div class="w-full flex place-content-center">
            <img
              src="{Config.PATH.staticUrl}/assets/bottlesnlegs.png"
              alt="Logo"
              class="h-16"
            />
          </div>
        </div>
        <div class="font-medium text-primary text-2xl text-center">
          Agent already exists
        </div>
        <div class="mt-4 font-medium text-accent text-md text-center">
          {walletAddress}
        </div>
        <div class="mt-4 font-medium text-secondary text-sm text-center">
          To use a different address, change the account connected in your
          wallet
        </div>
        <div class="daisy-modal-action place-content-center gap-10">
          <button
            class="daisy-btn daisy-btn-primary daisy-btn-outline"
            on:click={() => {
              existsModel.close();
              goto(Config.PATH.agent);
            }}>Sign In</button
          >
          <button
            class="daisy-btn daisy-btn-secondary daisy-btn-outline"
            on:click={() => {
              existsModel.close();
            }}>Cancel</button
          >
        </div>
      </div>
    {/if}
  </form>
</dialog>

<dialog id="signup_model" class="daisy-modal" bind:this={signupModel}>
  <form
    method="dialog"
    class="daisy-modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]"
    action="?/null_action"
  >
    <form
      method="POST"
      action="?/create_agent"
      use:enhance={({ formData }) => onSubmit({ formData })}
      class="flex flex-col place-content-center w-full"
    >
      <div class="w-full flex place-content-center">
        <img
          src="{Config.PATH.staticUrl}/assets/bottlesnlegs.png"
          alt="Logo"
          class="h-16"
        />
      </div>
      <div class="font-medium text-primary text-3xl text-center">
        Sign Up as an Agent
      </div>
      <div class="w-full flex flex-col place-content-center mt-4">
        <div class="font-medium text-secondary text-xl text-center">
          Agent Name
        </div>
        <div class="w-full flex place-content-center">
          <div class="daisy-form-control max-w-xs p-4">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <input
              type="text"
              name="name"
              placeholder={exampleName}
              class="daisy-input daisy-input-bordered daisy-input-primary w-full max-w-xs daisy-input-sm"
            />

            <!-- svelte-ignore a11y-label-has-associated-control -->
            {#if form?.badName}
              <label class="daisy-label">
                <span class="daisy-label-text-alt text-error"
                  >Between 3 and 50 characters</span
                >
              </label>
            {/if}
          </div>
        </div>
      </div>
      <div class="font-medium text-secondary text-xl text-center">
        Default Commission
      </div>
      <div class="w-full flex place-content-center">
        <div class="daisy-form-control max-w-xs p-4">
          <input
            type="text"
            name="defaultCommissionRate"
            placeholder={Config.UI.defaultCommissionRate.toString()}
            class="daisy-input daisy-input-bordered daisy-input-primary w-full max-w-xs daisy-input-sm"
          />

          <!-- svelte-ignore a11y-label-has-associated-control -->
          {#if form?.badCommission}
            <label class="daisy-label">
              <span class="daisy-label-text-alt text-error"
                >Between 0 and 100</span
              >
            </label>
          {/if}
        </div>
      </div>

      <div class="daisy-modal-action place-content-center gap-10">
        <button
          class="daisy-btn daisy-btn-primary daisy-btn-outline"
          type="submit">Sign Up</button
        >

        <button
          class="daisy-btn daisy-btn-secondary daisy-btn-outline"
          on:click|preventDefault={() => {
            signupModel.close();
            addressModel.showModal();
          }}>Cancel</button
        >
      </div>
    </form>
  </form>
</dialog>

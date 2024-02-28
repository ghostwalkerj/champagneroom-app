<script lang="ts">
  import type { WalletState } from '@web3-onboard/core';
  import { onDestroy, onMount } from 'svelte';
  import { uniqueNamesGenerator } from 'unique-names-generator';

  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  import config from '$lib/config';
  import { defaultWallet, selectedAccount } from '$lib/web3';
  import { womensNames } from '$lib/womensNames';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { ActionResult } from '@sveltejs/kit';
  import type { Unsubscriber } from 'svelte/store';
  import type { ActionData, PageData } from './$types';

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
  let profileImageUrl = config.UI.defaultProfileImage;

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
  class="flex w-full flex-col place-content-center text-center text-base-100"
>
  <h1 class="mt-10 text-3xl font-bold text-primary">
    Become an Agent and Earn with Your Creators
  </h1>

  {#if !wallet}
    <div class="mt-2 font-bold text-primary">You Need a Crypto Wallet</div>
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
        <div class="flex w-full flex-col place-content-center">
          <div class="flex w-full place-content-center">
            <img
              src="{config.PATH.staticUrl}/assets/bottlesnlegs.png"
              alt="Logo"
              class="h-16"
            />
          </div>
        </div>
        <div class="text-center text-2xl font-medium text-primary">
          Sign up with this address
        </div>
        <div class="text-md mt-4 text-center font-medium text-accent">
          {walletAddress}
        </div>
        <div class="mt-4 text-center text-sm font-medium text-secondary">
          To use a different address, change the account connected in your
          wallet
        </div>
        <div class="daisy-modal-action place-content-center gap-10">
          <button
            class="daisy-btn daisy-btn-outline daisy-btn-primary"
            on:click={() => {
              addressModel.close();
              signupModel.showModal();
            }}>Continue</button
          >
          <button
            class="daisy-btn daisy-btn-outline daisy-btn-secondary"
            on:click={() => addressModel.close()}>Cancel</button
          >
        </div>
      </div>
    {:else}
      <div>
        <div class="flex w-full place-content-center">
          <img
            src="{config.PATH.staticUrl}/assets/bottlesnlegs.png"
            alt="Logo"
            class="h-16"
          />
        </div>
        <div class="text-center text-2xl font-medium text-primary">
          Before you can sign up, connect your wallet
        </div>

        <div class="daisy-modal-action place-content-center gap-10">
          <ConnectButton />
          <button
            class="daisy-btn daisy-btn-outline daisy-btn-secondary"
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
        <div class="flex w-full flex-col place-content-center">
          <div class="flex w-full place-content-center">
            <img
              src="{config.PATH.staticUrl}/assets/bottlesnlegs.png"
              alt="Logo"
              class="h-16"
            />
          </div>
        </div>
        <div class="text-center text-2xl font-medium text-primary">
          Agent already exists
        </div>
        <div class="text-md mt-4 text-center font-medium text-accent">
          {walletAddress}
        </div>
        <div class="mt-4 text-center text-sm font-medium text-secondary">
          To use a different address, change the account connected in your
          wallet
        </div>
        <div class="daisy-modal-action place-content-center gap-10">
          <button
            class="daisy-btn daisy-btn-outline daisy-btn-primary"
            on:click={() => {
              existsModel.close();
              goto(config.PATH.agent);
            }}>Sign In</button
          >
          <button
            class="daisy-btn daisy-btn-outline daisy-btn-secondary"
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
      class="flex w-full flex-col place-content-center"
    >
      <div class="flex w-full place-content-center">
        <img
          src="{config.PATH.staticUrl}/assets/bottlesnlegs.png"
          alt="Logo"
          class="h-16"
        />
      </div>
      <div class="text-center text-3xl font-medium text-primary">
        Sign Up as an Agent
      </div>
      <div class="mt-4 flex w-full flex-col place-content-center">
        <div class="text-center text-xl font-medium text-secondary">
          Agent Name
        </div>
        <div class="flex w-full place-content-center">
          <div class="daisy-form-control max-w-xs p-4">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <input
              type="text"
              name="name"
              placeholder={exampleName}
              class="daisy-input daisy-input-sm daisy-input-bordered daisy-input-primary w-full max-w-xs"
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
      <div class="text-center text-xl font-medium text-secondary">
        Default Commission
      </div>
      <div class="flex w-full place-content-center">
        <div class="daisy-form-control max-w-xs p-4">
          <input
            type="text"
            name="defaultCommissionRate"
            placeholder={config.UI.defaultCommissionRate.toString()}
            class="daisy-input daisy-input-sm daisy-input-bordered daisy-input-primary w-full max-w-xs"
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
          class="daisy-btn daisy-btn-outline daisy-btn-primary"
          type="submit">Sign Up</button
        >

        <button
          class="daisy-btn daisy-btn-outline daisy-btn-secondary"
          on:click|preventDefault={() => {
            signupModel.close();
            addressModel.showModal();
          }}>Cancel</button
        >
      </div>
    </form>
  </form>
</dialog>

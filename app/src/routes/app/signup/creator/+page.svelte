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

  import type { ActionData, PageData } from '../$types';
  import type { Unsubscriber } from 'svelte/store';
  import { sign } from 'crypto';

  export let data: PageData;
  export let form: ActionData;

  const message = data.message;
  const user = data.user;

  $: walletAddress = '';
  let wallet: WalletState | undefined;
  let walletUnsub: Unsubscriber;
  let accountUnsub: Unsubscriber;

  let introModel: HTMLDialogElement;
  let addressModel: HTMLDialogElement;
  let signupModel: HTMLDialogElement;
  let existsModel: HTMLDialogElement;
  let profileImageUrl = Config.UI.defaultProfileImage;

  let exampleName = user
    ? user.name
    : uniqueNamesGenerator({
        dictionaries: [womensNames]
      });

  const updateProfileImage = async (url: string) => {
    if (url) {
      profileImageUrl = url;
    }
  };

  onMount(async () => {
    walletUnsub = defaultWallet.subscribe((_wallet) => {
      if (_wallet) {
        wallet = _wallet;
        introModel?.close();
        if (
          user &&
          user.address.toLowerCase() === walletAddress.toLowerCase()
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

  const onSubmit = async ({ formData }) => {
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

    return async ({ result }) => {
      if (result?.type === 'success') {
        goto(result.data.returnPath);
      } else {
        if (result?.data?.alreadyCreator) {
          existsModel.showModal();
          addressModel?.close();
          signupModel?.close();
        }
      }
      applyAction(result);
    };
  };
</script>

<div class="flex place-content-center w-full">
  <dialog id="address_modal" class="modal" bind:this={addressModel}>
    <form
      method="dialog"
      class="modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]
"
      action="?/null_action"
    >
      {#if wallet}
        <div>
          <div class="w-full flex flex-col place-content-center">
            <div class="w-full flex place-content-center">
              <img
                src="{Config.Path.staticUrl}/assets/bottlesnlegs.png"
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
          <div class="modal-action place-content-center gap-10">
            <button
              class="btn btn-primary btn-outline"
              on:click={() => {
                addressModel.close();
                signupModel.showModal();
              }}>Continue</button
            >
            <button
              class="btn btn-secondary btn-outline"
              on:click={() => addressModel.close()}>Cancel</button
            >
          </div>
        </div>
      {:else}
        <div>
          <div class="w-full flex place-content-center">
            <img
              src="{Config.Path.staticUrl}/assets/bottlesnlegs.png"
              alt="Logo"
              class="h-16"
            />
          </div>
          <div class="font-medium text-primary text-2xl text-center">
            Before you can sign up, connect your wallet
          </div>

          <div class="modal-action place-content-center gap-10">
            <ConnectButton />
            <button
              class="btn btn-secondary btn-outline"
              on:click={() => addressModel.close()}>Cancel</button
            >
          </div>
        </div>
      {/if}
    </form>
  </dialog>

  <dialog id="exist_model" class="modal" bind:this={existsModel}>
    <form
      method="dialog"
      class="modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]
"
      action="?/null_action"
    >
      {#if wallet}
        <div>
          <div class="w-full flex flex-col place-content-center">
            <div class="w-full flex place-content-center">
              <img
                src="{Config.Path.staticUrl}/assets/bottlesnlegs.png"
                alt="Logo"
                class="h-16"
              />
            </div>
          </div>
          <div class="font-medium text-primary text-2xl text-center">
            Creator already exists
          </div>
          <div class="mt-4 font-medium text-accent text-md text-center">
            {walletAddress}
          </div>
          <div class="mt-4 font-medium text-secondary text-sm text-center">
            To use a different address, change the account connected in your
            wallet
          </div>
          <div class="modal-action place-content-center gap-10">
            <button
              class="btn btn-secondary btn-outline"
              on:click={() => {
                addressModel.showModal();
                existsModel.close();
              }}>Cancel</button
            >
          </div>
        </div>
      {/if}
    </form>
  </dialog>

  <dialog id="signup_model" class="modal" bind:this={signupModel}>
    <form
      method="dialog"
      class="modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]"
      action="?/null_action"
    >
      <form
        method="POST"
        action="?/create_creator"
        use:enhance={({ formData }) => onSubmit({ formData })}
        class="flex flex-col place-content-center w-full"
      >
        <div class="w-full flex place-content-center">
          <img
            src="{Config.Path.staticUrl}/assets/bottlesnlegs.png"
            alt="Logo"
            class="h-16"
          />
        </div>
        <div class="font-medium text-primary text-3xl text-center">
          Sign Up as a Creator
        </div>
        <div class="w-full flex flex-col place-content-center mt-4">
          <div class="font-medium text-secondary text-xl text-center">
            Enter your Stage Name
          </div>
          <div class="w-full flex place-content-center">
            <div class="form-control max-w-xs p-4">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <input
                type="text"
                name="name"
                placeholder={exampleName}
                class="input input-bordered input-primary w-full max-w-xs input-sm"
              />

              <!-- svelte-ignore a11y-label-has-associated-control -->
              {#if form?.badName}
                <label class="label">
                  <span class="label-text-alt text-error"
                    >Between 3 and 50 characters</span
                  >
                </label>
              {/if}
            </div>
          </div>
        </div>
        <div class="modal-action place-content-center gap-10">
          <button class="btn btn-primary btn-outline" type="submit"
            >Sign Up</button
          >

          <button
            class="btn btn-secondary btn-outline"
            on:click|preventDefault={() => {
              signupModel.close();
              addressModel.showModal();
            }}>Cancel</button
          >
        </div>
      </form>
    </form>
  </dialog>
</div>

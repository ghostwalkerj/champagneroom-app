<script lang="ts">
  import type { WalletState } from '@web3-onboard/core';
  import { onMount } from 'svelte';
  import { uniqueNamesGenerator } from 'unique-names-generator';

  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import {
    PUBLIC_DEFAULT_PROFILE_IMAGE,
    PUBLIC_STATIC_URL
  } from '$env/static/public';

  import { defaultWallet } from '$lib/web3';
  import { womensNames } from '$lib/womensNames';

  import ConnectButton from '$components/header/ConnectButton.svelte';
  import ProfilePhoto from '$components/ProfilePhoto.svelte';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  const message = data.message;
  const user = data.user;
  let walletAddress = '';
  let wallet: WalletState | undefined;

  let introModel: HTMLDialogElement;
  let addressModel: HTMLDialogElement;
  let signupModel: HTMLDialogElement;
  let profileImageUrl = PUBLIC_DEFAULT_PROFILE_IMAGE;

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
    introModel.showModal();
    defaultWallet.subscribe((_wallet) => {
      if (_wallet) {
        wallet = _wallet;
        walletAddress = _wallet.accounts[0].address;
      } else {
        walletAddress = '';
        wallet = undefined;
      }
    });
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
      }
    };
  };
</script>

<div class="flex place-content-center w-full">
  <dialog id="intro_modal" class="modal" bind:this={introModel}>
    <form
      method="dialog"
      class="modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]
"
      action="?/null_action"
    >
      <div class="w-full flex place-content-center">
        <img
          src="{PUBLIC_STATIC_URL}/assets/bottlesnlegs.png"
          alt="Logo"
          class="h-16"
        />
      </div>
      <div
        class="font-medium text-primary text-3xl text-center font-CaviarDreams"
      >
        Sign Up as a Creator
      </div>
      <div class="font-medium text-primary text-sm text-center">
        Using your Crypto Wallet
      </div>
      <div class="modal-action place-content-center gap-10">
        <!-- if there is a button in form, it will close the modal -->
        <button
          class="btn btn-primary btn-outline"
          on:click={() => {
            introModel.close();
            addressModel.showModal();
          }}>Signup</button
        >

        <button class="btn btn-secondary btn-outline" on:click={() => goto('/')}
          >Cancel</button
        >
      </div>
    </form>
  </dialog>
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
                src="{PUBLIC_STATIC_URL}/assets/bottlesnlegs.png"
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
              on:click={() => goto('/')}>Cancel</button
            >
          </div>
        </div>
      {:else}
        <div>
          <div class="w-full flex place-content-center">
            <img
              src="{PUBLIC_STATIC_URL}/assets/bottlesnlegs.png"
              alt="Logo"
              class="h-16"
            />
          </div>
          <div class="font-medium text-primary text-2xl text-center">
            Before you can sign up, connect your wallet
          </div>

          <div class="modal-action place-content-center gap-10">
            <!-- if there is a button in form, it will close the modal -->
            <ConnectButton />
            <button
              class="btn btn-secondary btn-outline"
              on:click={() => goto('/')}>Cancel</button
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
            src="{PUBLIC_STATIC_URL}/assets/bottlesnlegs.png"
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
          <div class="font-medium text-secondary text-xl text-center mt-4">
            Upload a Profile Photo
          </div>
          <div>
            <ProfilePhoto
              profileImage={profileImageUrl}
              callBack={(value) => {
                updateProfileImage(value);
              }}
            />
          </div>
        </div>
        <div class="modal-action place-content-center gap-10">
          <button class="btn btn-primary btn-outline" type="submit"
            >Sign Up</button
          >

          <button
            class="btn btn-secondary btn-outline"
            on:click={() => goto('/')}>Cancel</button
          >
        </div>
      </form>
    </form>
  </dialog>
</div>

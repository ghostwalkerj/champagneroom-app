<script lang="ts">
  import type { WalletState } from '@web3-onboard/core';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { PUBLIC_STATIC_URL } from '$env/static/public';

  import { defaultWallet } from '$lib/util/web3';

  let walletAddress = '';
  let wallet: WalletState | undefined;

  let introModel: HTMLDialogElement;
  let signupModel: HTMLDialogElement;

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
</script>

<div class="flex place-content-center w-full">
  <dialog id="intro_modal" class="modal" bind:this={introModel}>
    <form
      method="dialog"
      class="modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]
"
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
      <div class="font-medium text-primary text-sm text-center">
        Using your Crypto Wallet
      </div>
      <div class="modal-action place-content-center gap-10">
        <!-- if there is a button in form, it will close the modal -->
        <button
          class="btn btn-primary btn-outline"
          on:click={() => {
            introModel.close();
            signupModel.showModal();
          }}>Signup</button
        >

        <button class="btn btn-secondary btn-outline" on:click={() => goto('/')}
          >Cancel</button
        >
      </div>
    </form>
  </dialog>
  <dialog id="signup_modal" class="modal" bind:this={signupModel}>
    <form
      method="dialog"
      class="modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]
"
    >
      {#if wallet}
        <div>
          <div class="w-full flex place-content-center">
            <img
              src="{PUBLIC_STATIC_URL}/assets/bottlesnlegs.png"
              alt="Logo"
              class="h-16"
            />
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
            <button class="btn btn-primary btn-outline">Continue</button>

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
          <div class="font-medium text-primary text-3xl text-center">
            You will need to connect your wallet
          </div>
          <div class="font-medium text-primary text-sm text-center">
            Using your Crypto Wallet
          </div>
          <div class="modal-action place-content-center gap-10">
            <!-- if there is a button in form, it will close the modal -->
            <button class="btn btn-primary btn-outline">Signup</button>

            <button
              class="btn btn-secondary btn-outline"
              on:click={() => goto('/')}>Cancel</button
            >
          </div>
        </div>
      {/if}
    </form>
  </dialog>
</div>

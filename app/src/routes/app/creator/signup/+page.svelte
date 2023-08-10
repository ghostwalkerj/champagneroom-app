<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { PUBLIC_STATIC_URL } from '$env/static/public';

  import { defaultWallet } from '$lib/util/web3';

  let walletAddress = '';

  let introModel: HTMLDialogElement;
  let shouldShowSignup = false;

  onMount(async () => {
    introModel.showModal();
    defaultWallet.subscribe((wallet) => {
      if (wallet) {
        walletAddress = wallet.accounts[0].address;
      }
    });
  });
</script>

<div class="flex place-content-center w-full">
  {#if !shouldShowSignup}
    <dialog id="into_modal" class="modal" bind:this={introModel}>
      <form
        method="dialog"
        class="modal-box bg-gradient-to-r from-[#0C082E] to-[#0C092E]
"
      >
        <div class="w-full flex place-content-center">
          <img
            src="{PUBLIC_STATIC_URL}/assets/bottlesnlegs.png"
            alt="Logo"
            class="h-40 -mt-10 -mb-10"
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
            on:click={() => (shouldShowSignup = true)}>Signup</button
          >

          <button
            class="btn btn-secondary btn-outline"
            on:click={() => goto('/')}>Cancel</button
          >
        </div>
      </form>
    </dialog>
  {/if}
</div>

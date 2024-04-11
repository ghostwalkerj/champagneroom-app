<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import type { WalletState } from '@web3-onboard/core';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { uniqueNamesGenerator } from 'unique-names-generator';

  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  import type { AgentDocument } from '$lib/models/agent';
  import type { UserDocument } from '$lib/models/user';

  import config from '$lib/config';
  import { defaultWallet, selectedAccount } from '$lib/web3';
  import { womensNames } from '$lib/womensNames';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  const message = data.message;
  const user = data.user as UserDocument;
  const isCreator = data.isCreator;

  const agent = data.agent as AgentDocument | undefined;

  $: walletAddress = '';
  let wallet: WalletState | undefined;
  let walletUnsub: Unsubscriber;
  let accountUnsub: Unsubscriber;

  let addressModel: HTMLDialogElement;
  let signupModel: HTMLDialogElement;
  let existsModel: HTMLDialogElement;
  let profileImageUrl = config.UI.defaultProfileImage;

  $: innerWidth = 0;
  $: innerHeight = 0;

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
        isCreator
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

    randomizeCardPositions();
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
    if (agent) {
      formData.append('agentId', agent._id.toString());
    }

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
      } else if (result.type === 'failure' && result.data!.alreadyCreator) {
        existsModel.showModal();
        addressModel?.close();
        signupModel?.close();
      }
      applyAction(result);
    };
  };

  function randomizeCardPositions() {
    const cards = document.querySelectorAll('.card') as unknown as [
      HTMLElement
    ];
    let positions: { x: number; y: number; width: number; height: number }[] =
      [];

    for (const [index, card] of cards.entries()) {
      let x: number,
        y: number,
        overlap: boolean,
        attempts = 0;
      do {
        overlap = false;
        // Adjust random position to consider daisy-card dimensions
        x = Math.random() * (innerWidth - card.offsetWidth - 500);
        y = Math.random() * (700 - card.offsetHeight);

        // Enhanced overlap check
        for (const pos of positions) {
          if (
            x < pos.x + pos.width &&
            x + card.offsetWidth > pos.x &&
            y < pos.y + pos.height &&
            y + card.offsetHeight > pos.y
          ) {
            overlap = true;
          }
        }

        // Boundary check for viewport
        if (
          x < 0 ||
          y + card.offsetHeight > innerHeight ||
          x + card.offsetWidth > innerWidth
        ) {
          overlap = true;
        }

        attempts++;
        if (attempts > 50) {
          // Adjust position for offscreen cards
          x =
            index > 0 ? positions[index - 1].x + positions[index - 1].width : 0;
          y = index > 0 ? positions[index - 1].y : 0;
          if (x + card.offsetWidth > innerWidth) {
            x = 0;
            y += card.offsetHeight;
          }
          break;
        }
      } while (overlap);

      // Apply the adjusted position
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      card.style.display = 'flex';

      // Store the new position
      positions.push({
        x,
        y,
        width: card.offsetWidth,
        height: card.offsetHeight
      });
    }
  }
</script>

ya<svelte:window bind:innerWidth bind:innerHeight />

<div
  class="text-base-100 flex w-full flex-col place-content-center text-center"
>
  <h1 class="mt-10 text-3xl font-bold text-primary-500">
    Join Our Creator Community and Thrive Globally
  </h1>

  {#if !wallet}
    <div class="mt-2 font-bold text-primary-500">You Need a Crypto Wallet</div>
  {/if}
  <div>
    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">
          Get Paid Quickly in Your Local Currency
        </h2>
        <div class="daisy-card-body text-primary-500">
          Experience the ease of receiving payments swiftly and securely, right
          in your local currency. No more exchange rate headaches or delays.
        </div>
      </div>
    </div>
    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">
          Hassle-Free Payment Handling
        </h2>
        <div class="daisy-card-body text-primary-500">
          Our streamlined payment system means you focus on creating, not on
          payment issues. We handle the complexities, you enjoy the rewards.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">
          Privacy is Our Priority
        </h2>
        <div class="daisy-card-body text-primary-500">
          Your safety matters. With us, your personal details stay private. No
          need to share names or phone numbers.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">
          Earn More with Fan Tips
        </h2>
        <div class="daisy-card-body text-primary-500">
          Connect with your audience in a meaningful way. Receive appreciation
          through tips directly from your fans.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">
          Exclusive Marketplace for Custom Content
        </h2>
        <div class="daisy-card-body text-primary-500">
          Unlock the potential of your creativity. Sell unique, custom content
          directly to your followers and boost your earnings.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">
          Global Reach, Local Comfort
        </h2>
        <div class="daisy-card-body text-primary-500">
          Wherever you are, connect with affluent customers from around the
          world. Your location is no longer a barrier to your success.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">
          Premium Prices for International Customers
        </h2>
        <div class="daisy-card-body text-primary-500">
          Maximize your earnings by setting competitive rates for international
          clients. Benefit from a wider, more lucrative market.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">
          Concierge Service at Your Fingertips
        </h2>
        <div class="daisy-card-body text-primary-500">
          Need assistance? Our concierge service is here to help you navigate
          and optimize your creator experience with ease.
        </div>
      </div>
    </div>

    <div class="visible absolute left-auto top-auto max-w-md">
      <div
        class="daisy-card border-secondary z-10 hidden transform rounded-lg border border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-secondary text-center text-xl">Join Us Now</h2>
        <div class="daisy-card-body text-primary-500">
          Ready to take your creative journey to the next level? Sign up today
          and be part of a community that values and empowers creators like you.
        </div>
      </div>
    </div>
  </div>
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
        <div class="text-center text-2xl font-medium text-primary-500">
          Sign up with this address
        </div>
        <div class="text-md mt-4 text-center font-medium text-secondary-500">
          {walletAddress}
        </div>
        <div class="text-secondary mt-4 text-center text-sm font-medium">
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
        <div class="text-center text-2xl font-medium text-primary-500">
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
        <div class="text-center text-2xl font-medium text-primary-500">
          Creator already exists
        </div>
        <div class="text-md mt-4 text-center font-medium text-secondary-500">
          {walletAddress}
        </div>
        <div class="text-secondary mt-4 text-center text-sm font-medium">
          To use a different address, change the account connected in your
          wallet
        </div>
        <div class="daisy-modal-action place-content-center gap-10">
          <button
            class="daisy-btn daisy-btn-outline daisy-btn-primary"
            on:click={() => {
              existsModel.close();
              goto(config.PATH.creator);
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
      action="?/create_creator"
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
      <div class="text-center text-3xl font-medium text-primary-500">
        Sign Up as a Creator
      </div>
      <div class="mt-4 flex w-full flex-col place-content-center">
        <div class="text-secondary text-center text-xl font-medium">
          Enter your Stage Name
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

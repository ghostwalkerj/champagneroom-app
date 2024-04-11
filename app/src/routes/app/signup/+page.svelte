<script lang="ts">
  import Icon from '@iconify/svelte';
  import { RadioGroup, RadioItem, Step, Stepper } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import { Image } from '@unpic/svelte';
  import type { WalletState } from '@web3-onboard/core';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { uniqueNamesGenerator } from 'unique-names-generator';

  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  import config from '$lib/config';
  import { UserRole } from '$lib/constants';
  import { defaultWallet, selectedAccount } from '$lib/web3';
  import { womensNames } from '$lib/womensNames';

  import type { PageData } from './$types';

  export let data: PageData;

  const message = data.message;

  const onStepHandler = (event: CustomEvent): void => {
    if (event.detail.step === 2) {
      exampleName =
        signUpRole === UserRole.AGENT
          ? 'Agent ' +
            uniqueNamesGenerator({
              dictionaries: [womensNames]
            })
          : uniqueNamesGenerator({
              dictionaries: [womensNames]
            });
    }
    signupName = exampleName;
  };

  $: stepStart = 0;
  let signUpRole = UserRole.CREATOR;
  let accountUnsub: Unsubscriber;
  let wallet: WalletState | undefined;
  let walletUnsub: Unsubscriber;
  $: exampleName = '';
  $: signupName = '';
  $: walletAddress = '';

  onMount(() => {
    accountUnsub = selectedAccount.subscribe((account) => {
      stepStart = account ? 1 : 0;
      if (account) {
        walletAddress = account.address;
      }
    });
    walletUnsub = defaultWallet.subscribe((_wallet) => {
      if (_wallet) {
        wallet = _wallet;
      }
    });
  });

  onDestroy(() => {
    accountUnsub?.();
    walletUnsub?.();
  });

  const onSubmit = async ({ formData }: { formData: FormData }) => {
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
      }
      applyAction(result);
    };
  };
</script>

<section class="flex min-h-screen max-w-2xl justify-center">
  {#key stepStart}
    <form
      action={signUpRole === UserRole.CREATOR
        ? '?/create_creator'
        : '?/create_agent'}
      method="POST"
      use:enhance={({ formData }) => onSubmit({ formData })}
    >
      <Stepper
        on:step={onStepHandler}
        class="min-w-2xl"
        start={stepStart}
        buttonCompleteLabel="Complete Sign Up"
        buttonCompleteType="submit"
      >
        <Step locked={!wallet}>
          <svelte:fragment slot="header"
            >Connect a Wallet to Sign Up</svelte:fragment
          >

          {#if !wallet}
            If you don't have a wallet, we can help you get one. A good place to
            start is <a
              data-sveltekit-preload-data="tap"
              href="https://ethereum.org/en/wallets/"
              target="_blank"
            >
              Ethereum.org</a
            >
            or
            <a
              data-sveltekit-preload-data="tap"
              href="https://metamask.io/"
              target="_blank"
            >
              Metamask</a
            >. After you create a wallet, you'll be able to sign up with it by
            connecting it to Champagne Room.
          {:else}
            <div class="text-2xl font-bold text-primary-500">
              Wallet is connected, continue to next step.
            </div>{/if}
        </Step>
        <Step>
          <div class="text-2xl font-bold text-primary-500">
            Sign up with this address
          </div>
          <div class="text-md text-secondary-500">
            {$selectedAccount?.address}
          </div>
          <div class="text-tertiary-500">
            To use a different address, change the account connected in your
            wallet.
          </div>
        </Step>
        <Step>
          <svelte:fragment slot="header">Choose Your Role</svelte:fragment>
          <RadioGroup
            class="flex w-full flex-col justify-evenly"
            active="variant-filled-primary"
            hover="hover:variant-soft-primary"
          >
            <RadioItem
              bind:group={signUpRole}
              name="signUpRole"
              value={UserRole.CREATOR}
              padding="p-0"
            >
              <div class="btn relative">
                <Image
                  src="{config.PATH.staticUrl}/assets/creator2.png"
                  alt="Creator"
                  background="auto"
                  loading="lazy"
                  width={350}
                  aspectRatio={1}
                />
                <div class="absolute right-6 top-4">
                  {#if signUpRole === UserRole.CREATOR}
                    <Icon
                      icon="zondicons:checkmark-outline"
                      width="48"
                      color="#EC31ED"
                    />
                  {/if}
                </div>

                <div
                  class="absolute bottom-5 left-0 right-0 flex flex-col text-white"
                >
                  <h2
                    class="flex items-center justify-center gap-2 text-2xl font-bold"
                  >
                    Join as a Creator
                  </h2>
                  <div
                    class="text-md flex w-full justify-center whitespace-nowrap font-bold"
                  >
                    <Icon
                      width="24"
                      class="-mb-1 text-primary-500"
                      icon="mdi:money-100"
                    />&nbsp;Earn money by selling your content
                  </div>
                </div>
              </div>
            </RadioItem>
            <RadioItem
              bind:group={signUpRole}
              name="signUpRole"
              value={UserRole.AGENT}
              padding="p-0"
            >
              <div class="btn relative">
                <Image
                  src="{config.PATH.staticUrl}/assets/agent1.png"
                  alt="Agent"
                  background="auto"
                  loading="lazy"
                  width={350}
                  aspectRatio={1}
                />
                <div class="absolute right-6 top-4">
                  {#if signUpRole === UserRole.AGENT}
                    <Icon
                      icon="zondicons:checkmark-outline"
                      width="48"
                      color="#EC31ED"
                    />
                  {/if}
                </div>
                <div
                  class="absolute bottom-5 left-0 right-0 flex flex-col text-white"
                >
                  <h2
                    class="flex items-center justify-center gap-2 text-2xl font-bold"
                  >
                    Join as an Agent
                  </h2>
                  <div class="text-bold text-md flex w-full justify-center">
                    <Icon
                      class="text-secondary -mb-1"
                      width="24"
                      icon="bi:coin"
                    /> &nbsp;Earn commissions from your creators
                  </div>
                </div>
              </div>
            </RadioItem>
          </RadioGroup>
        </Step>
        <Step locked={signupName.trim() === '' || signupName.trim().length < 3}>
          <svelte:fragment slot="header"
            >Confirm Details as an

            <span class="capitalize">{signUpRole.toLowerCase()}</span>
          </svelte:fragment>
          <div class="flex flex-row">
            <label class="label">
              {#if signUpRole === UserRole.CREATOR}
                <d>Stage Name</d>
              {:else}
                <d>Agent Name</d>
              {/if}
              <input
                class="input max-w-xl"
                title="Stage Name"
                type="text"
                name="name"
                placeholder={exampleName}
                bind:value={signupName}
              />
            </label>
          </div>
        </Step>
      </Stepper>
    </form>
  {/key}
</section>

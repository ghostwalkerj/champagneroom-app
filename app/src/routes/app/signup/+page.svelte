<script lang="ts">
  import Icon from '@iconify/svelte';
  import { RadioGroup, RadioItem, Step, Stepper } from '@skeletonlabs/skeleton';
  import { Image } from '@unpic/svelte';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import config from '$lib/config';
  import { UserRole } from '$lib/constants';
  import { selectedAccount } from '$lib/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import AgentForm from './AgentForm.svelte';
  import CreatorForm from './CreatorForm.svelte';

  const onNextHandler = (event: CustomEvent): void => {
    console.log('event:next', event.detail);
  };

  const onBackHandler = (event: CustomEvent): void => {
    console.log('event:prev', event.detail);
  };

  const onStepHandler = (event: CustomEvent): void => {
    console.log('event:step', event.detail);
  };
  const onCompleteHandler = (event: CustomEvent): void => {
    console.log('event:complete', event.detail);
    alert('Complete!');
  };

  $: isWalletConnected = true;
  $: stepStart = 1;
  let signUpRole = UserRole.CREATOR;
  let accountUnsub: Unsubscriber;

  onMount(() => {
    $selectedAccount &&
      selectedAccount.subscribe((account) => {
        isWalletConnected = account ? true : false;
        stepStart = isWalletConnected ? 1 : 0;
      });
  });

  onDestroy(() => {
    accountUnsub?.();
  });
</script>

<section class="flex min-h-screen w-full justify-center">
  {#key stepStart}
    <Stepper
      on:next={onNextHandler}
      on:back={onBackHandler}
      on:step={onStepHandler}
      on:complete={onCompleteHandler}
      class="w-full max-w-6xl"
      start={stepStart}
    >
      <Step locked={!isWalletConnected}>
        <svelte:fragment slot="header">Connect Wallet</svelte:fragment>

        {#if !isWalletConnected}<ConnectButton />
        {:else}
          <div class="text-2xl font-bold text-primary">
            Wallet is connected, continue to next step
          </div>{/if}
      </Step>
      <Step>
        <div class="text-2xl font-bold text-primary">
          Sign up with this address
        </div>
        <div class="text-md text-accent">
          {$selectedAccount?.address}
        </div>
        <div class=" text-secondary">
          To use a different address, change the account connected in your
          wallet
        </div>
      </Step>
      <Step>
        <svelte:fragment slot="header">Choose Your Role</svelte:fragment>
        <RadioGroup
          class="flex w-full justify-evenly "
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
                width={400}
                height={500}
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
              <div class="absolute bottom-5 left-0 right-0 flex flex-col">
                <h2 class="flex items-center justify-center gap-2 text-2xl">
                  Join as a Creator
                </h2>
                <div
                  class="flex w-full justify-center whitespace-nowrap text-lg"
                >
                  <Icon
                    width="24"
                    class="-mb-1 text-primary"
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
                src="{config.PATH.staticUrl}/assets/agent2.png"
                alt="Agent"
                background="auto"
                loading="lazy"
                width={400}
                height={500}
                layout="constrained"
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
              <div class="absolute bottom-5 left-0 right-0 flex flex-col">
                <h2 class="flex items-center justify-center gap-2 text-2xl">
                  Join as an Agent
                </h2>
                <div class="whitespace- flex w-full justify-center text-lg">
                  <Icon
                    class="-mb-1 text-secondary"
                    width="24"
                    icon="bi:coin"
                  /> &nbsp;Earn commissions from your creators
                </div>
              </div>
            </div>
          </RadioItem>
        </RadioGroup>
      </Step>
      <Step>
        <svelte:fragment slot="header"
          >Confirm Details as an

          <span class="capitalize">{signUpRole.toLowerCase()}</span>
        </svelte:fragment>

        {#if signUpRole === UserRole.CREATOR}
          <CreatorForm />
        {:else if signUpRole === UserRole.AGENT}
          <AgentForm />
        {/if}
      </Step>
    </Stepper>
  {/key}
</section>

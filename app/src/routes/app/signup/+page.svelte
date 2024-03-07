<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Step, Stepper } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';

  import config from '$lib/config';
  import { selectedAccount } from '$lib/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  let isLocked = true;

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

  onMount(() => {
    console.log('selectedAccount', $selectedAccount);
    $selectedAccount &&
      selectedAccount.subscribe((account) => {
        if (account) {
          console.log('account', account);
          isLocked = false;
        }
      });
  });
</script>

<section class="flex h-[70vh] justify-center">
  <Stepper
    on:next={onNextHandler}
    on:back={onBackHandler}
    on:step={onStepHandler}
    on:complete={onCompleteHandler}
  >
    {#if !$selectedAccount}
      <Step locked={isLocked}>
        <svelte:fragment slot="header">Connect Wallet</svelte:fragment>
        <ConnectButton />
      </Step>
    {/if}
    <Step>
      <svelte:fragment slot="header">(header)</svelte:fragment>
      (content)
    </Step>
  </Stepper>

  {#if $selectedAccount}
    <div class="flex h-full max-w-6xl flex-col gap-10">
      <h1 class="text-center text-3xl font-semibold uppercase">
        Join our community
      </h1>

      <div class="flex h-full flex-col justify-evenly gap-4 p-4 sm:flex-row">
        <a
          href={config.PATH.creatorSignup}
          class="min-w-xs bg-image group h-full overflow-hidden rounded-lg"
          style="background-image: url({config.PATH
            .staticUrl}/assets/creator2.png)"
        >
          <div
            class="bottom-0 left-0 right-0 flex h-full flex-col justify-end gap-3 bg-black bg-opacity-20 bg-gradient-to-t from-black to-[rgba(0,0,0,0)] p-4 text-center text-white transition delay-150 ease-in-out group-hover:bg-opacity-0"
          >
            <h2 class="flex items-center justify-center gap-2 text-2xl">
              As a Creator
            </h2>
            <div class="flex">
              <Icon
                width="24"
                class="-mb-1 text-primary"
                icon="mdi:money-100"
              /> Earn money by selling your content
            </div>
          </div>
        </a>

        <a
          href={config.PATH.agentSignup}
          class="min-w-xs bg-image group h-full overflow-hidden rounded-lg"
          style="background-image:url({config.PATH
            .staticUrl}/assets/agent2.png)"
        >
          <div
            class="bottom-0 left-0 right-0 flex h-full flex-col justify-end gap-3 bg-black bg-opacity-20 bg-gradient-to-t from-black to-[rgba(0,0,0,0)] p-4 text-center text-white transition delay-150 ease-in-out group-hover:bg-opacity-0"
          >
            <h2 class="flex items-center justify-center gap-2 text-2xl">
              As an Agent
            </h2>
            <div class="flex whitespace-nowrap">
              <Icon class="ml-20 text-secondary" width="20" icon="bi:coin" /> Earn
              commissions from your creators
            </div>
          </div>
        </a>
      </div>
    </div>
  {:else}
    <div class="mt-48">
      <ConnectButton />
    </div>
  {/if}
</section>

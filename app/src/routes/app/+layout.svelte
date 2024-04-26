<script lang="ts">
  import markerSDK from '@marker.io/browser';
  import { format, generate } from 'build-number-generator';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { dev } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import config from '$lib/config';
  import { AuthType } from '$lib/constants';
  import { selectedAccount } from '$lib/web3';

  import ConnectButton from '$components/header/ConnectButton.svelte';

  import { version } from '../../../package.json';

  import type { LayoutData } from './$types';

  export let data: LayoutData;

  const isAuthenticated = data.isAuthenticated;
  const authType = data.authType;
  const buildNumber = generate(version);
  const buildTime = format(buildNumber);
  let lastAddress: string | undefined;
  let signOut = config.PATH.signout;
  let accountUnsub: Unsubscriber;

  onMount(() => {
    if (!dev) {
      const loadWidget = async () =>
        await markerSDK.loadWidget({
          project: '661cbad15bce4e725b80f521'
        });
      loadWidget();
    }
    accountUnsub = selectedAccount.subscribe((account) => {
      if (account && lastAddress && account.address !== lastAddress) {
        lastAddress = account.address;
        if (isAuthenticated && authType === AuthType.SIGNING) {
          goto(
            signOut + '?returnPath=' + encodeURIComponent($page.url.pathname)
          );
        }
      }
      if (account && !lastAddress) {
        lastAddress = account.address;
      }
      if (!account && lastAddress) {
        lastAddress = undefined;
        if (isAuthenticated && authType === AuthType.SIGNING) {
          goto(
            signOut + '?returnPath=' + encodeURIComponent($page.url.pathname)
          );
        }
      }
    });
  });

  onDestroy(() => {
    accountUnsub?.();
  });
</script>

<div class="flex min-h-screen min-w-[320px] flex-col">
  <nav
    class="flex items-center justify-between px-4 shadow-lg shadow-surface-900"
  >
    <a class="display-inline" href="/">
      <img
        src="{config.PATH.staticUrl}/assets/logo-horizontal-tr.png"
        alt="Logo"
        width="300"
      />
    </a>

    <div class="text-xl font-semibold">
      {#if $selectedAccount}
        <div class=" flex items-center gap-2">
<<<<<<< Updated upstream
          <span class="h-3 w-3 rounded-full bg-primary-500" />
=======
          <span class="bg-primary h-3 w-3 rounded-full" />
>>>>>>> Stashed changes
          {#if !$page.data.user?.name}
            <span>Wallet Connected</span>
          {/if}
          {#if $page.data.user}
            <div class="text-xl">
              {$page.data.user.name}
            </div>
          {/if}
          {#if $page.data.authType === AuthType.IMPERSONATION}
            <a class="variant-outline btn" href={config.PATH.revert}>Revert </a>
          {:else if isAuthenticated}
            <a
              class="variant-outline btn"
              href={config.PATH.signout + '?returnPath=' + $page.url.pathname}
              >Sign Out</a
            >
          {/if}
        </div>
      {:else}
        <div class="flow flow-col text-md">
          <ConnectButton />
        </div>
      {/if}
    </div>
  </nav>

  <div class="flex flex-1 flex-col items-center justify-center">
    <slot />
  </div>

  <footer class="text-base-content sticky bottom-0 w-fit bg-surface-800 p-2">
    <p>Build Number: {buildNumber} |</p>
    <p>Build Time: {buildTime}</p>
  </footer>
</div>

<div
  class="fixed top-0 -z-10 flex h-screen w-full flex-col items-center justify-center text-3xl font-semibold lg:text-7xl"
>
  <h2 class="neon-secondary text-secondary-500">CHAMPAGNE</h2>
  <h2 class="neon-primary text-primary-500">R O O M</h2>
</div>

<script lang="ts">
  import { format, generate } from 'build-number-generator';
  import { onMount } from 'svelte';

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

  onMount(() => {
    selectedAccount.subscribe((account) => {
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
          <span class="h-3 w-3 rounded-full bg-primary" />
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
          {:else}
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

  <footer class="sticky bottom-0 w-fit bg-surface-800 p-2 text-base-content">
    <p>Build Number: {buildNumber} |</p>
    <p>Build Time: {buildTime}</p>
  </footer>
</div>

<div
  class="fixed top-0 -z-10 flex h-screen w-full flex-col items-center justify-center text-3xl font-semibold lg:text-7xl"
>
  <h2 class="neon-secondary text-secondary">CHAMPAGNE</h2>
  <h2 class="neon-primary text-primary">R O O M</h2>
</div>

<script lang="ts">
  import { format, generate } from 'build-number-generator';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import config from '$lib/config';
  import { AuthType } from '$lib/constants';
  import { selectedAccount } from '$lib/web3';

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

<div class=" flex flex-col min-h-screen min-w-[320px]">
  <nav
    class="flex justify-between items-center px-4 shadow-surface-900 shadow-lg"
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
          <span class="bg-primary h-3 w-3 rounded-full" />
          {#if !$page.data.user?.name}
            <span>Wallet Connected</span>
          {/if}
          {#if $page.data.user}
            <div class="text-xl">
              {$page.data.user.name}
            </div>
          {/if}
          {#if $page.data.authType === AuthType.IMPERSONATION}
            <a class="btn variant-outline" href={config.PATH.revert}>Revert </a>
          {:else}
            <a
              class="btn variant-outline"
              href={config.PATH.signout + '?returnPath=' + $page.url.pathname}
              >Signout</a
            >
          {/if}
        </div>
      {:else}
        <p>Connect your wallet to begin</p>
      {/if}
    </div>
  </nav>

  <div class="flex-1 flex flex-col items-center justify-center">
    <slot />
  </div>

  <footer class="w-fit bg-surface-800 p-2 text-base-content sticky bottom-0">
    <p>Build Number: {buildNumber} |</p>
    <p>Build Time: {buildTime}</p>
  </footer>
</div>

<div
  class="fixed h-screen flex flex-col text-3xl lg:text-7xl font-semibold justify-center items-center -z-10 top-0 w-full"
>
  <h2 class="text-secondary neon-secondary">CHAMPAGNE</h2>
  <h2 class="text-primary neon-primary">R O O M</h2>
</div>

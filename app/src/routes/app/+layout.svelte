<script lang="ts">
  import 'iconify-icon';

  import { format, generate } from 'build-number-generator';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import Config from '$lib/config';
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
  let signOut = Config.Path.signout;

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



<div
  class="bg-surface-900 flex flex-col min-h-screen min-w-[320px]"
>
  
<nav class="flex justify-between items-center px-4">
  <a class="display-inline" href="/">
      <img
        src="{Config.Path.staticUrl}/assets/logo-horizontal-tr.png"
        alt="Logo"
        width="300"
      />
    </a>

    <div class="text-xl font-semibold">
      {#if $selectedAccount}
      <div class=" flex items-center gap-2">
          <span class="bg-primary h-3 w-3 rounded-full"></span>
          {#if !$page.data.user?.name}
          <span>Wallet Connected</span>
          {/if}
          {#if $page.data.user}
          <div class="text-xl">
             {$page.data.user.name}
          </div>
        {/if}
          <a class="btn variant-outline" href={Config.Path.signout + '?returnPath=' + $page.url.pathname}>Signout</a>
          
      </div>
     
      
      {:else}
        <p>Connect your wallet to begin</p>
      {/if}
    </div>
</nav>

  <div class="flex-1">
    <slot />
  </div>

  <footer
    class="w-fit bg-surface-800 p-2 text-base-content sticky bottom-0"
  >

      <p>Build Number: {buildNumber} | </p>
      <p> Build Time: {buildTime}</p>

  </footer>
</div>


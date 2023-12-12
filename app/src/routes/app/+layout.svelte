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
  let signOut = Config.PATH.signout;

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
  class="bg-gradient-to-r from-[#0C082E] to-[#0C092E] font-Roboto flex flex-col min-h-screen min-w-[320px]"
>
  <div class="daisy-navbar w-screen">
    <div class="flex flex-col lg:flex-row w-screen">
      <div class="w-full lg:w-1/3 flex justify-center lg:ml-20">
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class="text-xl normal-case" href="/">
          <img
            src="{Config.PATH.staticUrl}/assets/logo-horizontal-tr.png"
            alt="Logo"
            width="260"
          />
        </a>
      </div>
      <div class="w-full text-center lg:w-1/3">
        <div class="font-bold mb-2 text-info">
          <div
            class="text-center text-lg lg:text-2xl xl:text-3xl whitespace-nowrap flex flex-row justify-center font-CaviarDreams"
          >
            <div class="neon-text">Welcome to the&nbsp;</div>
            <div class="neon-flicker">C</div>
            <div class="neon-text">HAMPAGNE ROOM</div>
          </div>
        </div>
        {#if $page.data.user}
          <div class="text-center text-xl text-accent font-CaviarDreams">
            {$page.data.user.name}
          </div>
        {/if}
      </div>
      <div class="w-full lg:w-1/3 text-right xl:mr-20">
        <ConnectButton />
        {#if $page.data.user}
          <button
            class="daisy-btn daisy-btn-xs daisy-btn-primary mr-4"
            on:click={() => {
              goto(
                signOut +
                  '?returnPath=' +
                  encodeURIComponent($page.url.pathname)
              );
            }}
          >
            Sign Out
          </button>
        {/if}
      </div>
    </div>
  </div>
  <div class="daisy-divider m-0" />

  <div class="flex-1">
    <slot />
  </div>

  <footer
    class="daisy-footer daisy-footer-center p-4 bg-base-300 text-base-content sticky bottom-0"
  >
    <div>
      <p>Build Number: {buildNumber}</p>
      <p>Build Time: {buildTime}</p>
    </div>
  </footer>
</div>

<style>
  /* Styles for the neon effect */
  @keyframes flicker {
    0%,
    19.999%,
    22%,
    62.999%,
    64%,
    64.999%,
    70%,
    100% {
      opacity: 1;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.7),
        0 0 20px rgba(255, 255, 255, 0.7), 0 0 30px rgba(255, 255, 255, 0.7);
    }
    20%,
    21.999%,
    63%,
    63.999%,
    65%,
    69.999% {
      opacity: 0.4;
      text-shadow: none;
    }
  }

  .neon-text {
    color: #07ffff; /* Your primary text color (pink) */
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.7),
      0 0 20px rgba(255, 255, 255, 0.7), 0 0 30px rgba(255, 255, 255, 0.7);
  }

  .neon-flicker {
    color: #07ffff; /* Your primary text color (pink) */
    animation: flicker 6s infinite; /* Adjust the animation duration as needed */
  }
</style>

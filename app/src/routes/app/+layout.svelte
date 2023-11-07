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
  const buildNumber = generate(version);
  const buildTime = format(buildNumber);
  let lastAddress: string | undefined;
  const authUrl = Config.Path.auth;

  onMount(() => {
    selectedAccount.subscribe((account) => {
      if (account && lastAddress && account.address !== lastAddress) {
        lastAddress = account.address;
        console.log('address changed');
        isAuthenticated && goto(authUrl);
      }
      if (account && !lastAddress) {
        lastAddress = account.address;
      }
      if (!account && lastAddress) {
        lastAddress = undefined;
        console.log('address changed');

        isAuthenticated && goto(authUrl);
      }
    });
  });
</script>

<div class="bg-gradient-to-r from-[#0C082E] to-[#0C092E] font-Roboto">
  <div class="navbar">
    <div class="flex w-screen">
      <div class="w-0 md:w-1/3 flex md:ml-20">
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class="text-xl normal-case" href="/">
          <img
            src="{Config.Path.staticUrl}/assets/logo-horizontal-tr.png"
            alt="Logo"
            width="260"
          /></a
        >
      </div>
      <div class="w-full text-center">
        <div class="font-bold mb-2 text-info">
          <div
            class="text-center text-lg md:text-2xl lg:text-3xl whitespace-nowrap flex flex-row justify-center font-CaviarDreams"
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
      <div class="md:w-1/3 text-right lg:mr-20">
        <ConnectButton />
        {#if $page.data.user && $page.data.user.authType === AuthType.SIGNING}
          <button
            class="btn btn-primary"
            on:click={() => {
              goto(Config.Path.auth + '?signOut', { replaceState: true });
            }}
          >
            Sign Out
          </button>
        {/if}
      </div>
    </div>
  </div>
  <div class="divider m-0" />

  <div class="min-h-screen">
    <slot />
  </div>
</div>
<footer class="footer footer-center p-4 bg-base-300 text-base-content z-0">
  <div>
    <p>Build Number: {buildNumber}</p>
    <p>Build Time: {buildTime}</p>
  </div>
</footer>

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

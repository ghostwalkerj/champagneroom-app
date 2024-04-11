<script lang="ts">
  import Icon from '@iconify/svelte';
  import {
    Drawer,
    type DrawerSettings,
    getDrawerStore
  } from '@skeletonlabs/skeleton';

  import { page } from '$app/stores';

  import config from '$lib/config';

  const links = [
    { name: 'About', href: '#About' },
    { name: 'The Show', href: '#TheShow' },
    { name: 'FAQ', href: '#FAQ' },
    { name: 'Creators', href: '#Creators' },
    { name: 'Token', href: '#Token' },
    { name: 'Contact', href: '#Contact' },
    { name: 'Open App', href: config.PATH.openApp },
    { name: 'Sign Up', href: config.PATH.signup }
  ];

  const drawerSettings: DrawerSettings = {
    id: 'rightDrawer',
    // Provide your property overrides:
    bgDrawer: 'bg-purple-900 text-white',
    bgBackdrop:
      'bg-gradient-to-tr from-indigo-500/50 via-purple-500/50 to-pink-500/50',
    width: 'w-80',
    padding: 'p-4',
    rounded: 'rounded-xl',
    position: 'right'
  };

  const drawerStore = getDrawerStore();

  function closeNav() {
    drawerStore.close();
  }
</script>

<Drawer>
  {#if $drawerStore.id == 'rightDrawer'}
    <ul class="bg-base-100 flex min-h-full w-80 flex-col gap-4 p-4">
      {#each links.toReversed() as link}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li on:click={closeNav}>
          {#if link.name == 'Sign Up'}
            <a
              class="from-primary btn w-full whitespace-nowrap rounded-lg bg-gradient-to-br to-pink-500 py-4 text-black hover:shadow-[0px_0px_17px_6px_#e779c1]"
              href={link.href}
              ><span class="font-Roboto font-bold">{link.name}</span></a
            >
          {:else if link.name == 'Open App'}
            <a
              class="variant-filled-surface btn flex flex-nowrap"
              class:text-primary-500={link.href == $page.url.hash}
              href={link.href}
            >
              <span class="block whitespace-nowrap">{link.name}</span>
              <img
                src="/icons/champagne bottles_01.png"
                alt="champagne icon"
                class="block h-8"
              />
            </a>
          {:else}
            <a
              class="hover:text-primary-500-500 btn w-full whitespace-nowrap text-sm hover:bg-[#e779c122]"
              class:text-primary-500={link.href == $page.url.hash}
              href={link.href}>{link.name}</a
            >
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</Drawer>

<!-- Desktop Navbar -->
<div class="flex items-center justify-between">
  <a href="/" class="w-[180px] lg:w-[280px]">
    <img
      alt="logo"
      src="{config.PATH.staticUrl}/assets/logo-horizontal-tr.png"
      class=""
    />
  </a>

  <!-- Desktop links with full items -->
  <ul class="hidden items-center gap-4 p-4 lg:flex">
    {#each links as link}
      <li>
        {#if link.name == 'Sign Up'}
          <a
            class="btn whitespace-nowrap bg-gradient-to-br from-primary-500 to-pink-500 text-black hover:shadow-[0px_0px_17px_6px_#e779c1]"
            href={link.href}>{link.name}</a
          >
        {:else if link.name == 'Open App'}
          <a
            class="variant-filled-surface btn flex flex-nowrap"
            class:text-primary-500={link.href == $page.url.hash}
            href={link.href}
          >
            {link.name}
            <img
              src="/icons/champagne bottles_01.png"
              alt="champagne icon"
              class="block h-5"
            />
          </a>
        {:else}
          <a
            class="hover:text-primary-500-500 btn whitespace-nowrap font-semibold hover:bg-[#e779c122]"
            class:text-primary-500={link.href == $page.url.hash}
            href={link.href}>{link.name}</a
          >
        {/if}
      </li>
    {/each}
  </ul>

  <!-- Mobile navbar -->
  <div class="flex items-center lg:hidden">
    <ul class="hidden items-center gap-2 p-2 sm:flex">
      {#each links as link}
        <li>
          {#if link.name == 'Sign Up'}
            <a
              class="from-primary btn whitespace-nowrap rounded-lg bg-gradient-to-br to-pink-500 py-3.5 text-black hover:shadow-[0px_0px_17px_6px_#e779c1]"
              href={link.href}>{link.name}</a
            >
          {:else if link.name == 'Open App'}
            <a
              class="variant-filled-surface btn flex flex-nowrap"
              class:text-primary-500={link.href == $page.url.hash}
              href={link.href}
            >
              {link.name}
              <img
                src="/icons/champagne bottles_01.png"
                alt="champagne icon"
                class="block h-5"
              />
            </a>
          {/if}
        </li>
      {/each}
    </ul>

    <!-- Drawer content-->
    <button
      type="button"
      class="btn-icon"
      on:click={() => {
        drawerStore.open(drawerSettings);
      }}
    >
      <Icon icon="quill:hamburger" width="28" height="28"></Icon>
    </button>
  </div>
</div>

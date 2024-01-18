<script lang="ts">
  import { page } from '$app/stores';
  import Config from '$lib/models/config';

  const links = [
    { name: 'About', href: '#About' },
    { name: 'The Show', href: '#TheShow' },
    { name: 'FAQ', href: '#FAQ' },
    { name: 'Creators', href: '#Creators' },
    { name: 'Token', href: '#Token' },
    { name: 'Contact', href: '#Contact' },
    { name: 'Open App', href: Config.PATH.openApp },
    { name: 'Sign Up', href: Config.PATH.signup }
  ];

  function closeNav() {
    const drawer = document.getElementById('rightDrawer') as HTMLInputElement;
    drawer.checked = false;
  }
</script>

<!-- Desktop Navbar -->

<div class="flex justify-between items-center">
  <a href="/" class="w-[180px] lg:w-[280px]">
    <img
      alt="logo"
      src="{Config.PATH.staticUrl}/assets/logo-horizontal-tr.png"
      class=""
    />
  </a>

  <!-- Desktop links with full items -->
  <ul class="hidden lg:flex items-center gap-4 p-4">
    {#each links as link}
      <li>
        {#if link.name == 'Sign Up'}
          <a
            class="daisy-btn daisy-btn-ghost bg-gradient-to-r from-primary to-pink-500 text-black whitespace-nowrap hover:shadow-[0px_0px_17px_6px_#e779c1]"
            href={link.href}>{link.name}</a
          >
        {:else if link.name == 'Open App'}
          <a
            class="daisy-btn flex flex-nowrap hover:text-primary bg-[#e779c122]"
            class:text-primary={link.href == $page.url.hash}
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
            class="daisy-btn daisy-btn-ghost whitespace-nowrap hover:text-primary hover:bg-[#e779c122]"
            class:text-primary={link.href == $page.url.hash}
            href={link.href}>{link.name}</a
          >
        {/if}
      </li>
    {/each}
  </ul>

  <!-- Mobile navbar -->
  <div class="lg:hidden flex items-center">
    <ul class="hidden sm:flex items-center gap-2 p-2">
      {#each links as link}
        <li>
          {#if link.name == 'Sign Up'}
            <a
              class="daisy-btn daisy-btn-ghost bg-gradient-to-r from-primary to-pink-500 text-black whitespace-nowrap hover:shadow-[0px_0px_17px_6px_#e779c1]"
              href={link.href}>{link.name}</a
            >
          {:else if link.name == 'Open App'}
            <a
              class="daisy-btn flex flex-nowrap hover:text-primary bg-[#e779c122]"
              class:text-primary={link.href == $page.url.hash}
              href={link.href}
            >
              <span class="block whitespace-nowrap">{link.name}</span>
              <img
                src="/icons/champagne bottles_01.png"
                alt="champagne icon"
                class="block h-8"
              />
            </a>
          {/if}
        </li>
      {/each}
    </ul>
    <label
      for="rightDrawer"
      aria-label="open sidebar"
      class="daisy-btn daisy-btn-square daisy-btn-ghost mr-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block w-6 h-6 stroke-current"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        /></svg
      >
    </label>
  </div>
</div>

<!-- Drawer content-->
<div class="daisy-drawer daisy-drawer-end z-50">
  <input id="rightDrawer" type="checkbox" class="daisy-drawer-toggle" />
  <div class="daisy-drawer-content">
    <!-- Page content here -->
  </div>
  <div class="daisy-drawer-side">
    <label
      for="rightDrawer"
      aria-label="close sidebar"
      class="drawer-overlay"
    />
    <ul class="p-4 w-80 min-h-full bg-base-100 gap-4 flex flex-col">
      {#each links.toReversed() as link}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li on:click={closeNav}>
          {#if link.name == 'Sign Up'}
            <a
              class="daisy-btn daisy-btn-ghost daisy-btn-block bg-gradient-to-r from-primary to-pink-500 text-black whitespace-nowrap hover:shadow-[0px_0px_17px_6px_#e779c1]"
              href={link.href}>{link.name}</a
            >
          {:else if link.name == 'Open App'}
            <a
              class="daisy-btn flex flex-nowrap hover:text-primary bg-[#e779c122]"
              class:text-primary={link.href == $page.url.hash}
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
              class="daisy-btn daisy-btn-ghost daisy-btn-block whitespace-nowrap hover:text-primary hover:bg-[#e779c122]"
              class:text-primary={link.href == $page.url.hash}
              href={link.href}>{link.name}</a
            >
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</div>

<script lang="ts">
  import Config from '$lib/config';
</script>

<!-- Mobile Dropdown Menu -->
<div class="sticky top-0 z-30 w-screen flex justify-end -mb-12 lg:hidden pr-3">
  <div class="dropdown dropdown-bottom dropdown-end">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label
      tabindex="0"
      class="btn btn-xs btn-outline btn-secondary m-1 bg-indigo"
      aria-haspopup="true"
      aria-expanded="false"
    >
      <iconify-icon icon="mdi:hamburger-menu" />
    </label>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <ul
      tabindex="0"
      class="dropdown-content menu p-2 shadow bg-base-100 rounded-box text-secondary z-10 w-52"
    >
      <li><a href={Config.Path.openApp}>Open App</a></li>
      <li><a href="#About">About</a></li>
      <li><a href="#TheShow">Show</a></li>
      <li><a href="#FAQ">FAQ</a></li>
      <li><a href="#Creators">Creators</a></li>
      <li><a href="#Token">Token</a></li>
      <li><a href="#Contact">Contact</a></li>
      <li><a href={Config.Path.signup}>Sign Up</a></li>

      <li><a href="/">Back to Top</a></li>
    </ul>
  </div>
</div>

<!-- Desktop Navbar -->
<div
  class="lg:sticky lg:top-0 lg:z-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E]"
>
  <div class="flex flex-col lg:flex-row items-center w-screen">
    <div class="max-w-[600px] lg:max-w-[280px]">
      <a href="/">
        <img
          alt="logo"
          src="{Config.Path.staticUrl}/assets/logo-horizontal-tr.png"
          class="w-auto my-auto mt-1 lg:ml-10 mr-2"
        />
      </a>
    </div>
    <div class="hidden lg:flex w-full ml-10">
      <div class="navbar-center py-2 lg:flex w-full justify-end">
        <ul class="menu menu-horizontal px-4 mt-2 mr-10 min-w-full justify-end">
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#About">About</a
            >
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#TheShow">Show</a
            >
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#FAQ">FAQ</a
            >
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#Creators">Creators</a
            >
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#Token">Token</a
            >
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#Contact">Contact</a
            >
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href={Config.Path.signup}>Sign Up</a
            >
          </li>
          <li>
            <a
              class="btn btn-outline btn-primary whitespace-nowrap shadow-[0px_0px_17px_6px_#e779c1] btn-sm mt-2 ml-3"
              href={Config.Path.openApp}>Open App</a
            >
          </li>
        </ul>
      </div>
    </div>
    <!-- Mobile App Button -->
    <div class="lg:hidden flex w-full mt-6 mb-4 place-content-center">
      <a
        class="btn btn-outline btn-primary whitespace-nowrap shadow-[0px_0px_17px_6px_#e779c1]"
        href={Config.Path.openApp}>Open App</a
      >
    </div>
  </div>
  <div class="divider m-0 -mt-2" />
</div>

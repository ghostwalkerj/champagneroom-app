<script lang="ts">
  import { PUBLIC_OPEN_APP_PATH, PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div
  class="sticky -mb-12 lg:mr-0 lg:hidden top-2 z-30 pr-2 w-screen flex justify-end"
>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <div class="dropdown dropdown-bottom dropdown-end">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <label
      tabindex="0"
      class="btn btn-xs btn-outline btn-secondary m-1 bg-indigo"
      ><iconify-icon icon="mdi:hamburger-menu" /></label
    >

    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <ul
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 shadow text-secondary bg-base-100 rounded-box w-52"
    >
      <li><a href={PUBLIC_OPEN_APP_PATH}>Open App</a></li>
      <li><a href="#About">About</a></li>
      <li><a href="#TheShow">Show</a></li>
      <li><a href="#FAQ">FAQ</a></li>
      <li><a href="#Creators">Creators</a></li>
      <li><a href="#Token">Token</a></li>
      <li><a href="#Contact">Contact</a></li>
      <li><a href="/">Back to Top</a></li>
    </ul>
  </div>
</div>

<div
  class=" lg:sticky lg:top-0 lg:z-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E]"
>
  <div class="flex flex-col lg:flex-row w-screen">
    <div class=" w-screen max-w-[600px] lg:max-w-[280px]">
      <a href="/">
        <img
          alt="logo"
          src="{PUBLIC_STATIC_URL}/assets/logo-horizontal-tr.png"
          class="lg:ml-10 mr-2 w-auto my-auto mt-1"
        />
      </a>
    </div>
    <div class="hidden lg:w-full lg:flex ml-10">
      <div class="navbar-center py-2 lg:flex w-full justify-end">
        <ul class="menu menu-horizontal px-4 mt-2 mr-10 min-w-full justify-end">
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#About"
            >
              About
            </a>
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#TheShow"
            >
              Show
            </a>
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#FAQ"
            >
              FAQ
            </a>
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#Creators"
            >
              Creators
            </a>
          </li>
          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#Token"
            >
              TOKEN
            </a>
          </li>

          <li>
            <a
              class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
              href="#Contact"
            >
              Contact
            </a>
          </li>

          <li>
            <a
              class="btn btn-outline btn-primary whitespace-nowrap shadow-[0px_0px_17px_6px_#e779c1] btn-sm mt-2 ml-3"
              href={PUBLIC_OPEN_APP_PATH}
            >
              Open App
            </a>
          </li>
        </ul>
      </div>
      <div class="navbar-end hidden sm:block" />
    </div>
    <div class="lg:hidden flex w-full mt-6 mb-4 place-content-center">
      <a
        class="btn btn-outline btn-primary whitespace-nowrap shadow-[0px_0px_17px_6px_#e779c1]"
        href={PUBLIC_OPEN_APP_PATH}
      >
        Open App
      </a>
    </div>
  </div>
  <div class="divider m-0 -mt-2" />
</div>

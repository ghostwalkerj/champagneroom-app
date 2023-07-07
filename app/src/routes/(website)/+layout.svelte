<script lang="ts">
  import 'iconify-icon';
  import '../../app.css';

  import { PUBLIC_AGENT_PATH, PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div class="min-h-screen flex flex-col">
  <div class="bg-gradient-to-r from-indigo-900 navbar">
    <div class="flex w-screen">
      <div class="w-1/3 flex">
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class="text-xl btn btn-ghost normal-case" href="/">
          <img
            src="{PUBLIC_STATIC_URL}/assets/logo.png"
            alt="Logo"
            width="48"
          /></a
        >
        <ul
          class="menu menu-vertical lg:menu-horizontal bg-base-200 rounded-box"
        >
          <li><a>FAQ</a></li>
          <li><a>White Paper</a></li>
          <li><a>Sign Up</a></li>
          <li><a href={PUBLIC_AGENT_PATH}>Agent Login</a></li>
        </ul>
      </div>
      <div>
        <div
          class=" font-bold text-2xl lg:text-3xl xl:text-4xl grid grid-cols-1 md:flex"
        >
          <div class="whitespace-nowrap text-center">Welcome to &nbsp;</div>
          <div class="whitespace-nowrap text-center">the Champagne Room</div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-indigo-900 min-h-screen">
    <slot />
  </div>
</div>

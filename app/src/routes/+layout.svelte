<script lang="ts">
  import 'iconify-icon';
  import '../app.css';

  import ConnectButton from '$components/header/ConnectButton.svelte';
  import { nameStore } from '$stores';

  const title = 'Welcome to the Champagne Room';
</script>

<div class="grid grid-cols-1">
  <div class="bg-base-100 navbar">
    <div class="flex w-screen">
      <div class="w-1/3">
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class="text-xl btn btn-ghost normal-case">
          <img src="/logo.png" alt="Logo" width="48" /></a
        >
      </div>
      <div>
        <div
          class="grow text-center font-bold text-2xl lg:text-3xl xl:text-4xl"
        >
          {title}
        </div>
        <div class="text-center text-xl">{$nameStore}</div>
      </div>
      <div class="w-1/4 text-right">
        <ConnectButton />
      </div>
    </div>
  </div>

  <div class="">
    <slot />
  </div>
</div>

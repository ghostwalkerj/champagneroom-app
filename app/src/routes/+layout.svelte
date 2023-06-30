<script lang="ts">
  import 'iconify-icon';
  import '../app.css';

  import { format, generate } from 'build-number-generator';

  import ConnectButton from '$components/header/ConnectButton.svelte';
  import { nameStore } from '$stores';
  const buildNumber = generate('0.2');
  const buildTime = format(buildNumber);
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
          class=" font-bold text-2xl lg:text-3xl xl:text-4xl grid grid-cols-1 md:flex"
        >
          <div class="whitespace-nowrap text-center">Welcome to &nbsp;</div>
          <div class="whitespace-nowrap text-center">the Champagne Room</div>
        </div>
        <div class="text-center text-xl">{$nameStore}</div>
      </div>
      <div class="w-1/3 text-right">
        <ConnectButton />
      </div>
    </div>
  </div>

  <div class="">
    <slot />
    <footer
      class="absolute bottom-0 footer footer-center p-4 bg-base-300 text-base-content"
    >
      <div>
        <p>Build Number: {buildNumber}</p>
        <p>Build Time: {buildTime}</p>
      </div>
    </footer>
  </div>
</div>

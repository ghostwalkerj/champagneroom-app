<script lang="ts">
  import 'iconify-icon';
  import '../app.css';

  import { format, generate } from 'build-number-generator';

  import { browser } from '$app/environment';
  import { PUBLIC_STATIC_URL } from '$env/static/public';

  import ConnectButton from '$components/header/ConnectButton.svelte';
  import { nameStore } from '$stores';

  import { version } from '../../package.json';

  const buildNumber = generate(version);
  const buildTime = format(buildNumber);

  if (browser) {
    (function () {
      window.ybug_settings = { id: 'vmjfcvd23zharamd1bb8' };
      var ybug = document.createElement('script');
      ybug.type = 'text/javascript';
      ybug.async = true;
      ybug.src =
        'https://widget.ybug.io/button/' + window.ybug_settings.id + '.js';
      var s = document.querySelectorAll('script')[0];
      s.parentNode.insertBefore(ybug, s);
    })();
  }
</script>

<div class="grid grid-cols-1">
  <div class="bg-base-100 navbar">
    <div class="flex w-screen">
      <div class="w-1/3">
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class="text-xl btn btn-ghost normal-case">
          <img
            src="{PUBLIC_STATIC_URL}/assets/logo.png"
            alt="Logo"
            width="48"
          /></a
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

  <div class="bg-gradient-to-r from-indigo-900">
    <slot />
    <footer
      class="ticky top-[100vh] footer footer-center p-4 bg-base-300 text-base-content z-0"
    >
      <div>
        <p>Build Number: {buildNumber}</p>
        <p>Build Time: {buildTime}</p>
      </div>
    </footer>
  </div>
</div>

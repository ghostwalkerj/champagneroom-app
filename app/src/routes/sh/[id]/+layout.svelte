<script lang="ts">
  import ConnectButton from '$components/header/ConnectButton.svelte';
</script>

<div class="grid grid-cols-1">
  <div class="bg-base-100 navbar">
    <div class="flex w-screen">
      <div class="w-1/4">
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class="text-xl btn btn-ghost normal-case">
          <img src="/logo.png" alt="Logo" width="48" /></a
        >
      </div>
      <div class="grow text-center font-bold text-2xl lg:text-3xl xl:text-4xl">
        Welcome to the Champagne Room
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

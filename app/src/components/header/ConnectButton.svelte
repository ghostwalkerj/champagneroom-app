<script lang="ts">
  import NeonBlur from '$components/NeonBlur.svelte';
  import { connect, selectedAccount } from '$lib/web3';
  import Icon from '@iconify/svelte';
</script>

{#if !$selectedAccount}
  <NeonBlur>
    <button
      class="btn btn-xl rounded-lg variant-filled relative"
      on:click={connect}
    >
      <Icon
        class="text-pink-600"
        icon="carbon:ibm-cloud-hyper-protect-crypto-services"
      />
      <span>Connect Wallet</span></button
    >
  </NeonBlur>
{/if}

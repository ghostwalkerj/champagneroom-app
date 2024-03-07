<script lang="ts">
  import Icon from '@iconify/svelte';

  import { connect, selectedAccount } from '$lib/web3';

  import NeonBlur from '$components/NeonBlur.svelte';
</script>

{#if !$selectedAccount}
  <NeonBlur>
    <button
      class="variant-filled btn btn-xl relative rounded-lg"
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

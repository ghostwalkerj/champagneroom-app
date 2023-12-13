<script lang="ts">
  import { connect, selectedAccount } from '$lib/web3';
  import NeonBlur from '$components/NeonBlur.svelte';
</script>

{#if !$selectedAccount}
<NeonBlur>
  <button
    class="btn btn-xl rounded-lg variant-filled relative"
    on:click={connect}>
    <iconify-icon class="text-pink-600" icon="carbon:ibm-cloud-hyper-protect-crypto-services"></iconify-icon>
    <span>Connect Wallet</span></button>
</NeonBlur>
{/if}


<script lang="ts">
  import { connect, selectedAccount } from '$lib/web3';
</script>

{#if !$selectedAccount}
  <button
    class="daisy-btn daisy-btn-outline daisy-btn-primary"
    on:click={connect}>Connect Wallet</button
  >
{/if}

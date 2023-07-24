<script lang="ts">
  import { connect, selectedAccount } from '$lib/util/web3';
</script>

{#if !$selectedAccount}
  <button class="btn btn-outline text-primary" on:click={connect}
    >Connect Wallet</button
  >
{/if}

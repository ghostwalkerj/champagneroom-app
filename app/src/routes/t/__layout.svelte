<script lang="ts">
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import { selectedAccount } from 'svelte-web3';
</script>

<div class="bg-base-100 navbar">
	<div class="flex-1">
		<!-- svelte-ignore a11y-missing-attribute -->
		<a class="text-xl btn btn-ghost normal-case"> <img src="/logo.png" alt="Logo" width="48" /></a>
	</div>
	<div class="flex-none">
		<ConnectButton />
	</div>
</div>

<div class="h-full">
	<slot />
</div>

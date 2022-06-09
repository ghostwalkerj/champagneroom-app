<script lang="ts">
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import 'virtual:windi.css';
</script>

<div class="navbar bg-base-100">
	<div class="flex-1">
		<!-- svelte-ignore a11y-missing-attribute -->
		<a class="btn btn-ghost normal-case text-xl"> <img src="logo.png" alt="Logo" width="48" /></a>
	</div>
	<div class="flex-none">
		<ConnectButton />
	</div>
</div>

<div class="h-full">
	<slot />
</div>

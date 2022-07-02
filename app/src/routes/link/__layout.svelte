<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@sveltestack/svelte-query';
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import { selectedAccount } from 'svelte-web3';
	import 'virtual:windi.css';
	const queryClient = new QueryClient();
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

<QueryClientProvider client={queryClient}>
	<div class="h-full">
		<slot />
	</div>
</QueryClientProvider>

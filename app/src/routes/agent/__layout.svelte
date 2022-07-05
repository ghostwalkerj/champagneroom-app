<script lang="ts">
	import { QueryClient,QueryClientProvider } from '@sveltestack/svelte-query';
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import { selectedAccount } from 'svelte-web3';
	const queryClient = new QueryClient();
</script>

{#if $selectedAccount}
	<QueryClientProvider client={queryClient}>
		<div class="h-full">
			<slot />
		</div>
	</QueryClientProvider>
{:else}
	<div class="min-h-screen-md bg-base-100 hero">
		<div class="text-center hero-content">
			<div class="max-w-md">
				<h1 class="font-bold text-5xl">Welcome to pCall</h1>
				<p class="py-6">
					Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit eam ad opus nunc et
					adepto a pCall!
				</p>
				<ConnectButton />
			</div>
		</div>
	</div>
{/if}

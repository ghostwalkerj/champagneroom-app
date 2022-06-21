<script type="ts">
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import type { LinkType } from 'db/models/Link';
	import { selectedAccount } from 'svelte-web3';

	export let linkDocument: LinkType;
</script>

<div class="min-h-screen-md bg-base-100 hero">
	<div class="text-center hero-content">
		<div class="max-w-lg">
			<h1 class="font-bold text-5xl">Make your pCall</h1>
			<p class="py-6">Scis vis facere illud pCall. Carpe florem et fac quod nunc vocant.</p>
			{#if $selectedAccount && linkDocument != null}
				<div class="flex flex-col p-2 justify-center items-center">
					<div class="bg-primary text-primary-content stats">
						<div class="stat">
							<div class="stat-title">You are Calling</div>
							<div class="stat-value">{linkDocument.name}</div>
							<div class="stat-actions">
								<button class="btn btn-sm btn-success">Add funds</button>
							</div>
						</div>

						<div class="stat">
							<div class="stat-title">Amount</div>
							<div class="stat-value">${linkDocument.amount} USD</div>
							<div class="stat-actions">
								<button class="btn btn-sm">Send</button>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<ConnectButton />
			{/if}
		</div>
	</div>
</div>

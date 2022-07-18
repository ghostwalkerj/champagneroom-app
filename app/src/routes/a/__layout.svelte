<script lang="ts">
	import ConnectButton from '$lib/components/web3/ConnectButton.svelte';
	import { createAgent } from '$lib/db/models/agent';
	import { agentDB, currentAgent } from '$lib/db/pcallDB';
	import { selectedAccount } from 'svelte-web3';

	//TODO: This will be authentication later
	selectedAccount.subscribe(async (account) => {
		if (account) {
			const db$ = await agentDB(account);
			let agent = await db$.agent
				.findOne()
				.where('address')
				.eq(account)
				// .where('entityType')
				// .eq('agent')
				.exec();
			if (!agent) {
				const _agent = createAgent({
					address: account
				});
				console.log('insert agent: ' + _agent);
				agent = await db$.agent.insert(_agent);
			}
			currentAgent.set(agent);
			console.log(agent);
		}
	});
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

{#if $selectedAccount}
	<div class="h-full">
		<slot />
	</div>
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

<script lang="ts">
	import ConnectButton from '$lib/components/web3/ConnectButton.svelte';
	import { AUTH_PATH } from '$lib/constants';
	import { AgentType } from '$lib/db/models/agent';
	import { agentDB, currentAgent, currentAgentDB } from '$lib/db/stores/agentDB';
	import { selectedAccount } from 'svelte-web3';

	async function doAuth(address: string) {
		const res = await fetch(AUTH_PATH, {
			method: 'POST',
			body: JSON.stringify({
				address,
				type: 'agent'
			})
		});
		const body = await res.json();
		return body.token;
	}

	//TODO: This will be authentication later
	selectedAccount.subscribe(async (account) => {
		if (account) {
			const agentId = AgentType + ':' + account;
			const token = await doAuth(account);
			const db = await agentDB(token, agentId);
			let agent = await db.agents.findOne(agentId).exec();
			if (!agent) {
				const _agent = await db.agents.createAgent(account);
				console.log('insert agent: ' + JSON.stringify(_agent));
				agent = _agent;
			}
			currentAgent.set(agent);
			currentAgentDB.set(db);
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

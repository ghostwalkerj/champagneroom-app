<script context="module">
	import { AUTH_PATH, TokenRoles } from '$lib/constants';

	//TODO: Only return token if agent address is good.
	export async function load({ url, fetch }) {
		const auth_url = urlJoin(url.origin, AUTH_PATH);
		try {
			const res = await fetch(auth_url, {
				method: 'POST',
				body: JSON.stringify({
					tokenRole: TokenRoles.AGENT
				})
			});
			const body = await res.json();
			const token = body.token;
			return { props: { token } };
		} catch (e) {
			console.log(e);
		}
	}
</script>

<script lang="ts">
	import ConnectButton from '$lib/components/web3/ConnectButton.svelte';
	import { agentDB, thisAgent } from '$lib/ORM/dbs/agentDB';
	import { AgentString, type AgentDocument } from '$lib/ORM/models/agent';
	import { selectedAccount } from 'svelte-web3';
	import urlJoin from 'url-join';
	import { StorageTypes } from '$lib/ORM/rxdb';
	export let token: string;

	//TODO: This will be authentication later
	selectedAccount.subscribe(async (account) => {
		if (account) {
			const agentId = AgentString + ':' + account;
			const db = await agentDB(token, agentId, StorageTypes.IDB);
			thisAgent.subscribe(async (_agent: AgentDocument) => {
				if (!_agent) {
					const _agent = await db.agents.createAgent(account);
					console.log('insert agent: ' + JSON.stringify(_agent));
					thisAgent.set(_agent);
				}
			});
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

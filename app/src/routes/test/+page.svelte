<script context="module" lang="ts">
	throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

	// import { AUTH_PATH, TokenRoles } from '$lib/constants';
	// import urlJoin from 'url-join';

	// //TODO: Only return token if agent address is good.
	// export async function load({ url, fetch }) {
	// 	const auth_url = urlJoin(url.origin, AUTH_PATH);
	// 	try {
	// 		const res = await fetch(auth_url, {
	// 			method: 'POST',
	// 			body: JSON.stringify({
	// 				tokenRole: TokenRoles.AGENT
	// 			})
	// 		});
	// 		const body = await res.json();
	// 		const token = body.token;
	// 		return { props: { token } };
	// 	} catch (e) {
	// 		console.log(e);
	// 	}
	// }
</script>

<script lang="ts">
	throw new Error("@migration task: Add data prop (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292707)");

	import TalentForm from '$lib/components/talent/TalentForm.svelte';
	import TalentTable from '$lib/components/talent/TalentTable.svelte';
	import { agentDB } from '$lib/ORM/dbs/agentDB';
	import { AgentString, type AgentDocument } from '$lib/ORM/models/agent';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { selectedAccount } from 'svelte-web3';
	import AgentWallet from '$lib/components/agent/AgentWallet.svelte';
	import TopTalent from '$lib/components/talent/TopTalent.svelte';
	import { generateTalent } from '$lib/dataHelper';

	export let token: string;

	//TODO: This will be authentication later
	selectedAccount.subscribe(async (account) => {
		if (account) {
			const agentId = AgentString + ':' + account;
			const db = await agentDB(token, agentId, StorageTypes.IDB);
			db.agents.findOne(agentId).$.subscribe((_agent) => {
				if (_agent) {
					agent = _agent;
					agent.populate('talents').then((_talents) => {
						talents = _talents;
					});
				} else {
					console.log('Create new agent');
					db.agents.createAgent(account);
				}
			});
		}
	});

	let agent: AgentDocument;
	let talents: TalentDocument[];
</script>

{#if agent}
	<div class="min-h-full">
		<main class="p-10">
			<!-- Page header -->
			<div class="bg-black  rounded-lg mx-auto py-4 px-4 sm:px-6 lg:px-8">
				<div class="font-semibold text-primary text-md leading-6">
					Agent Dashboard

					<button
						class="btn btn-sm"
						on:click={() => {
							generateTalent(agent);
						}}>Create Data</button
					>
				</div>
				<div class="divider" />

				<div class="mx-auto  w-full px-4 md:flex  md:items-center md:justify-between " />
				<div class="mx-auto grid gap-2 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
					<div class="p-1">
						<AgentWallet {agent} />
					</div>
					{#key talents}
						<!-- Talent viewing and adding -->
						<div class="p-1">
							<TalentForm {agent} {talents} />
						</div>
						<div class="p-1 row-span-2 ">
							<TopTalent {talents} />
						</div>
						<div class="p-1  lg:col-span-2">
							<TalentTable {talents} />
						</div>
					{/key}
				</div>
			</div>
		</main>
	</div>
{:else}
	Loading Agent....
{/if}

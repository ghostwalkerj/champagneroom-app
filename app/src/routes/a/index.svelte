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

<script type="ts">
	import { agentDB } from '$lib/ORM/dbs/agentDB';
	import { type AgentDocument, AgentString } from '$lib/ORM/models/agent';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { selectedAccount } from 'svelte-web3';
	import urlJoin from 'url-join';
	import TalentForm from '$lib/components/forms/TalentForm.svelte';
	import TalentTable from '$lib/components/forms/TalentTable.svelte';

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
			<div class="bg-black rounded-lg mx-auto max-w-7xl py-4 px-4 sm:px-6 lg:px-8">
				<div class="font-semibold text-primary text-md leading-6">Agent Dashboard</div>
				<div class="divider" />

				<div
					class="mx-auto max-w-3xl px-4 md:flex  md:items-center md:justify-between lg:max-w-7xl "
				/>
				<div
					class="mx-auto mt-8 max-w-3xl grid grid-cols-1 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3"
				>
					<!-- Talent viewing and adding -->
					<div class="space-y-6 lg:col-start-1 lg:col-span-2">
						<TalentForm {agent} {talents} />
						<TalentTable {talents} />
					</div>
				</div>
			</div>
		</main>
	</div>
{:else}
	Loading Agent....
{/if}

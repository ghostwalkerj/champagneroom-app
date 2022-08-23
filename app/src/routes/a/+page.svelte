<script lang="ts">
	import { agentDB } from '$lib/ORM/dbs/agentDB';
	import { AgentString, type AgentDocument } from '$lib/ORM/models/agent';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { generateTalent } from '$lib/util/dataHelper';
	import { selectedAccount } from 'svelte-web3';
	import type { Errors, PageData } from './$types';
	import AgentWallet from './AgentWallet.svelte';
	import TalentForm from './TalentForm.svelte';
	import TalentTable from './TalentTable.svelte';
	import TopTalent from './TopTalent.svelte';

	export let data: PageData;
	export let errors: Errors;

	if (errors) console.log(errors);
	const token = data!.token;
	//TODO: This will be authentication later
	selectedAccount.subscribe(async (account) => {
		if (account) {
			const agentId = AgentString + ':' + account;
			const db = await agentDB(token, agentId, StorageTypes.IDB);
			db.agents.findOne(agentId).$.subscribe((_agent) => {
				if (_agent) {
					agent = _agent;
					talents = [];
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
	let talents: TalentDocument[] = [];
</script>

{#if agent}
	<div class="min-h-full">
		<main class="p-10">
			<!-- Page header -->
			{#key agent._id}
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
			{/key}
		</main>
	</div>
{:else}
	Loading Agent....
{/if}

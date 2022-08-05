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
	import { page } from '$app/stores';
	import { TALENT_PATH } from '$lib/constants';
	import { agentDB } from '$lib/ORM/dbs/agentDB';
	import { type AgentDocument, AgentString } from '$lib/ORM/models/agent';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { nanoid } from 'nanoid';
	import { createForm } from 'svelte-forms-lib';
	import { selectedAccount } from 'svelte-web3';
	import urlJoin from 'url-join';
	import * as yup from 'yup';
	import TalentForm from '$lib/components/forms/TalentForm.svelte';

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

	const { form, errors, handleReset, handleChange, handleSubmit } = createForm({
		initialValues: { name: '', agentCommission: '10' },
		validationSchema: yup.object({
			name: yup.string().required('Talent name is required'),
			agentCommission: yup
				.number()
				.min(0)
				.max(100)
				.integer()
				.required('Agent commission between 0 and 100 required')
		}),
		onSubmit: async (values) => {
			const talent = await agent.createTalent(
				values.name,
				talentkey,
				Number.parseInt(values.agentCommission)
			);
			handleReset();
			talents = talents.concat([talent]);
		}
	});

	let agent: AgentDocument;
	let talents: TalentDocument[];

	$: talentkey = nanoid();
	$: talentUrl = urlJoin($page.url.origin, TALENT_PATH, talentkey);
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
					<!-- talent Form-->
					<div class="space-y-6 lg:col-start-1 lg:col-span-2">
						<TalentForm {agent} {talents} />
						<div>
							{#if talents && talents.length > 0}
								{#each talents as talent, id}
									<li>
										<a href="/t/{talent.key}">{talent.name}</a>
									</li>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
{:else}
	Loading Agent....
{/if}

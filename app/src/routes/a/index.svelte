<script type="ts">
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-zod';
	import { useQueryClient } from '@sveltestack/svelte-query';
	import type { AgentDocument } from 'db/models/agent';
	import { TalentDocument, TalentSchema } from 'db/models/talent';
	import { getOrCreateAgentByAddress } from 'db/queries/agentQueries';
	import { createForm } from 'felte';
	import { PCALL_TALENT_URL } from 'lib/constants';
	import { nanoid } from 'nanoid';
	import { selectedAccount } from 'svelte-web3';
	import urlJoin from 'url-join';
	import { nan, set } from 'zod';

	const queryClient = useQueryClient();
	const { form, setFields, data, reset } = createForm({
		extend: [
			reporter,
			validator({
				schema: TalentSchema
			})
		],
		async onSuccess(response: any) {
			const body: {
				success: boolean;
				talentDocument: TalentDocument;
			} = await response.json();
			if (body.success) {
				if (agent) {
					agent.talents!.push(body.talentDocument);
				}
				queryClient.invalidateQueries(['agent', address]);
			}
			reset();
		},
		onerror(err: any) {
			console.log(err);
		}
	});

	let address = '';
	selectedAccount.subscribe((account) => {
		if (account) {
			address = account;
		}
	});

	let agentQueryResult;
	let agent: AgentDocument;
	$: talentkey = nanoid();
	$: if (address) {
		agentQueryResult = getOrCreateAgentByAddress(address);
	}
	let talents: TalentDocument[] = [];
	$: if (agentQueryResult && $agentQueryResult.isSuccess) {
		agent = $agentQueryResult.data.agent;
		if (agent) {
			setFields('agentId', agent._id);
			talents = agent.talents || [];
		}
		setFields('talentKey', talentkey);
	}

	$: talentUrl = urlJoin(PCALL_TALENT_URL, talentkey);
</script>

<div class="min-h-full">
	<main class="p-10">
		<!-- Page header -->
		<div class="mx-auto max-w-3xl px-4 md:flex  md:items-center md:justify-between lg:max-w-7xl " />
		<div
			class="mx-auto mt-8 max-w-3xl grid grid-cols-1 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3"
		>
			<div class="space-y-6 lg:col-start-1 lg:col-span-2">
				<!-- talent Form-->
				<div class="bg-primary text-primary-content card">
					<div class="text-center card-body items-center">
						<h2 class="text-2xl card-title">New Talent</h2>

						<div class="text-white whitespace-nowrap">
							<form use:form method="post">
								<input type="hidden" name="agentId" />
								<input type="hidden" name="talentKey" />

								<div class="max-w-xs w-full py-2 form-control">
									<!-- svelte-ignore a11y-label-has-associated-control -->
									<label class="label">
										<span class="label-text">Talent Name</span>
									</label>
									<input
										type="text"
										id="name"
										name="name"
										placeholder="Enter a name"
										class="max-w-xs w-full py-2 input input-bordered input-primary"
									/>
									<ValidationMessage for="name" let:messages={message}>
										<span>{message}</span>
										<span slot="placeholder" />
									</ValidationMessage>
								</div>
								<div class="max-w-xs w-full py-2 form-control">
									<!-- svelte-ignore a11y-label-has-associated-control -->
									<label class="label">
										<span class="label-text">Talent Private URL</span>
									</label>
									<div><a href={talentUrl}>{talentUrl}</a></div>
								</div>
								<div class="py-4">
									<button class="btn btn-secondary" type="submit">Save </button>
								</div>
							</form>
						</div>
					</div>
				</div>

				<div>
					{#each talents as talent, i}
						<li>
							{i + 1}: <a href="/t/{talent.talentKey}">{talent.name}</a>
						</li>
					{/each}
				</div>
			</div>
		</div>
	</main>
</div>

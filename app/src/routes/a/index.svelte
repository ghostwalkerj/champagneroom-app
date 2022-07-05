<script type="ts">
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-zod';
	import { useQueryClient } from '@sveltestack/svelte-query';
	import type { AgentDocument } from 'db/models/agent';
	import { TalentDocument, TalentSchema } from 'db/models/talent';
	import { getOrCreateAgentByAddress } from 'db/queries/agentQueries';
	import { createForm } from 'felte';
	import { nanoid } from 'nanoid';
	import { selectedAccount } from 'svelte-web3';
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
	}
</script>

<div class="min-h-full">
	<main class="py-10">
		<!-- Page header -->
		<div
			class="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
		/>
		<div
			class="mx-auto mt-8 max-w-3xl grid gap-6 grid-cols-1 sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3"
		>
			<div class="space-y-6 lg:col-start-1 lg:col-span-2">
				<!-- talent Form-->
				<div class="bg-primary text-primary-content card">
					<div class="text-center card-body items-center">
						<h2 class="text-2xl card-title">New Talent</h2>

						<div class="flex flex-col text-white p-2 justify-center items-center">
							<form use:form method="post">
								<input type="hidden" name="agentId" />
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
										<span class="label-text">Talent Key</span>
									</label>
									<input
										type="text"
										id="talentKey"
										name="talentKey"
										value={nanoid()}
										placeholder="Talent Key"
										readonly
										class="max-w-xs w-full py-2 input input-bordered input-primary"
									/>
								</div>
								<div class="py-4">
									<button class="btn btn-secondary" type="submit">Save talent</button>
								</div>
							</form>
						</div>
					</div>
				</div>

				<div>
					{#each talents as talent, i}
						<li>
							{i + 1}: <a href="/t/{talent._id}">{talent.name}</a>
						</li>
					{/each}
				</div>
			</div>
		</div>
	</main>
</div>

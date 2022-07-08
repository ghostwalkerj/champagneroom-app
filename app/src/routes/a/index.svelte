<script type="ts">
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-zod';
	import { gun } from 'db';
	import { AgentType, createAgent, type Agent } from 'db/models/agent';
	import { TalentSchema, type Talent } from 'db/models/talent';
	import { createForm } from 'felte';
	import 'gun/lib/not.js';
	import { PCALL_TALENT_URL } from 'lib/constants';
	import { nanoid } from 'nanoid';
	import { selectedAccount } from 'svelte-web3';
	import urlJoin from 'url-join';

	const { form, reset } = createForm({
		extend: [
			reporter,
			validator({
				schema: TalentSchema
			})
		],
		transform: (values: any) => ({
			...values,
			agentCommission: parseInt(values.agentCommission, 10)
		}),
		onerror(err: any) {
			console.log(err);
		},
		onSubmit(values, context) {
			reset();
		}
	});

	let agentRef = gun.get(AgentType);
	let agent;
	let talents: Record<string, Talent> = {};

	selectedAccount.subscribe((account) => {
		if (account) {
			agentRef
				.get(account, (ack) => {
					if (!ack.put) {
						agentRef.get(account).put(createAgent(account));
						console.log('Created New Agent');
					}
				})
				.on((_agent: Agent) => {
					agent = _agent;
				});
		}
	});

	$: talentkey = nanoid();

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

						<div class="text-white text-left whitespace-nowrap">
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
								<label for="price" class="label">
									<span class="label-text">Commission Percentage</span></label
								>
								<div class="form-control">
									<!-- svelte-ignore a11y-label-has-associated-control -->

									<div class="rounded-md shadow-sm mt-1 w-20 relative">
										<input
											type="text"
											name="agentCommission"
											id="agentCommission"
											class="py-2 w-20 input input-bordered input-primary "
											value="10"
										/>
										<div class="flex  inset-y-4 right-4 absolute pointer-events-none">
											<span class="text-gray-500 sm:text-sm"> % </span>
										</div>
									</div>

									<ValidationMessage for="agentCommission" let:messages={message}>
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
					<!-- {#each talents as talent, i}
						<li>
							{i + 1}: <a href="/t/{talent.talentKey}">{talent.name}</a>
						</li>
					{/each} -->
				</div>
			</div>
		</div>
	</main>
</div>

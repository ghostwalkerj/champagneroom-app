<script type="ts">
	import { gun } from '$lib/db/gun';
	import { AgentType, createAgent, type Agent } from '$lib/db/models/agent';
	import { createTalent, TalentSchema, TalentType, type Talent } from '$lib/db/models/talent';
	import type { IGunChain, IGunInstance } from 'gun';
	import { PCALL_TALENT_URL } from '$lib/constants';
	import { nanoid } from 'nanoid';
	import { createForm } from 'svelte-forms-lib';
	import { selectedAccount } from 'svelte-web3';
	import urlJoin from 'url-join';
	import * as yup from 'yup';

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
		onSubmit: (values) => {
			const talentParams = TalentSchema.cast({
				agentId: agent._id,
				name: values.name,
				agentCommission: Number.parseInt(values.agentCommission),
				key: talentkey
			});
			const talent = createTalent(talentParams);
			const talentRef = gun.get(TalentType).get(talent._id).put(talent);
			gun.get(TalentType).get(talent.key).put(talentRef);
			agentRef.get('talents').set(talentRef); // save talent to agent
			handleReset();
		}
	});

	let agentRef: IGunChain<
		any,
		IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>,
		IGunInstance<any>,
		string
	>;

	let agent: Agent;
	let talents: Talent[] = [];
	$: talentkey = nanoid();
	$: talentUrl = urlJoin(PCALL_TALENT_URL, talentkey);

	selectedAccount.subscribe((account) => {
		if (account) {
			agentRef = gun.get(account, (ack) => {
				if (!ack.put) {
					agent = createAgent({
						address: account
					});
					const _agent = gun.get(AgentType).get(account).put(agent);
					gun.get(AgentType).get(agent._id).put(_agent);
				}
			});

			agentRef.on((_agent: Agent) => {
				agent = _agent;
			});

			agentRef
				.get('talents')
				.once(() => {})
				.map()
				.once((_talent: any) => {
					if (_talent) {
						talents = talents.concat(_talent);
					}
				});
		}
	});
</script>

{#if agent}
	<div class="min-h-full">
		<main class="p-10">
			<!-- Page header -->
			<div
				class="mx-auto max-w-3xl px-4 md:flex  md:items-center md:justify-between lg:max-w-7xl "
			/>
			<div
				class="mx-auto mt-8 max-w-3xl grid grid-cols-1 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3"
			>
				<div class="space-y-6 lg:col-start-1 lg:col-span-2">
					<!-- talent Form-->
					<div class="bg-primary text-primary-content card">
						<div class="text-center card-body items-center">
							<h2 class="text-2xl card-title">New Talent</h2>

							<div class="text-white text-left whitespace-nowrap">
								<form on:submit|preventDefault={handleSubmit}>
									<div class="max-w-xs w-full py-2 form-control">
										<!-- svelte-ignore a11y-label-has-associated-control -->
										<label class="label">
											<span class="label-text">Talent Name</span>
										</label>
										<input
											type="text"
											name="name"
											placeholder="Enter a name"
											class="max-w-xs w-full py-2 input input-bordered input-primary"
											on:change={handleChange}
											bind:value={$form.name}
										/>
									</div>
									{#if $errors.name}
										<div class="shadow-lg alert alert-error">{$errors.name}</div>
									{/if}

									<label for="price" class="label">
										<span class="label-text">Commission Percentage</span></label
									>
									<div class="form-control">
										<!-- svelte-ignore a11y-label-has-associated-control -->

										<div class="rounded-md shadow-sm mt-1 w-20 relative">
											<input
												type="text"
												name="agentCommission"
												class="py-2 w-20 input input-bordered input-primary"
												bind:value={$form.agentCommission}
												on:change={handleChange}
											/>
											<div class="flex  inset-y-4 right-4 absolute pointer-events-none">
												<span class="text-gray-500 sm:text-sm"> % </span>
											</div>
										</div>
									</div>
									{#if $errors.agentCommission}
										<div class="shadow-lg alert alert-error">{$errors.agentCommission}</div>
									{/if}
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
						{#if talents.length > 0}
							{#each talents as talent, id}
								<li>
									<a href="/t/{talent.key}">{talent.name}</a>
								</li>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</main>
	</div>
{:else}
	Loading Agent....
{/if}

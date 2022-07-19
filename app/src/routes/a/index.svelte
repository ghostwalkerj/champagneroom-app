<script type="ts">
	import { PCALL_TALENT_URL } from '$lib/constants';
	import type { AgentDocument } from '$lib/db/models/agent';
	import { createTalent, TalentSchema, type Talent } from '$lib/db/models/talent';
	import { currentAgent } from '$lib/db/pcallDB';
	import { nanoid } from 'nanoid';
	import { createForm } from 'svelte-forms-lib';
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
		}
	});

	let agent: AgentDocument;
	$: currentAgent.subscribe((_agent) => {
		if (_agent) {
			agent = _agent;
		}
	});
	let talents: Talent[] = [];
	$: talentkey = nanoid();
	$: talentUrl = urlJoin(PCALL_TALENT_URL, talentkey);
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

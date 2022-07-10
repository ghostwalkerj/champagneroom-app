<script type="ts">
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-zod';
	import { gun } from 'db';
	import { AgentByAddress, AgentById, createAgent, type Agent } from 'db/models/agent';
	import {
		createTalent,
		TalentById,
		TalentByKey,
		TalentSchema,
		type Talent
	} from 'db/models/talent';
	import { createForm } from 'felte';
	import type { IGunChain, IGunInstance } from 'gun';
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
		onSubmit(values) {
			const talent = createTalent(values as Talent);
			const talentRef = talentById.get(talent._id).put(talent);
			talentByKey.get(talent.key).put(talentRef); // save talent by key
			agentRef.get('talents').set(talent); // save talent to agent
			talents = talents.concat(talent);
			reset();
		}
	});

	let agentByAddress = gun.get(AgentByAddress);
	let agentById = gun.get(AgentById);
	let talentById = gun.get(TalentById);
	let talentByKey = gun.get(TalentByKey);
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
			agentRef = agentByAddress.get(account, (ack) => {
				if (!ack.put) {
					agent = createAgent({ address: account });
					const agentRef = agentByAddress.get(account).put(agent);
					agentById.get(agent._id).put(agentRef);
					console.log('Created New Agent');
				}
			});

			agentRef.on((_agent: Agent) => {
				agent = _agent;
			});

			talents = [];
			console.log('clear talents');
			agentRef
				.get('talents')
				.map()
				.once((_talent: any) => {
					console.log('add', _talent.name);
					talents.push(_talent);
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
								<form use:form method="post">
									<input type="hidden" name="agentId" value={agent._id} />
									<input type="hidden" name="key" value={talentkey} />

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
	Can't create agent
{/if}

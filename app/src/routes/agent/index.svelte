<script type="ts">
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-zod';
	import { useQueryClient } from '@sveltestack/svelte-query';
	import type { AgentDocument } from 'db/models/agent';
	import { CreatorDocument, CreatorSchema } from 'db/models/creator';
	import { getOrCreateAgentByAddress } from 'db/queries/agentQueries';
	import { createForm } from 'felte';
	import { selectedAccount } from 'svelte-web3';

	const queryClient = useQueryClient();

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
	$: if (agentQueryResult && $agentQueryResult.isSuccess) {
		agent = $agentQueryResult.data.creators;
		console.log(agent);
	}

	const { form, reset } = createForm({
		extend: [
			reporter,
			validator({
				schema: CreatorSchema
			})
		],
		async onSuccess(response: any) {
			const body: {
				success: boolean;
				creatorDocument: CreatorDocument;
			} = await response.json();
			if (body.success) {
				queryClient.setQueryData(['agent', address], body);
			}
			reset();
		},
		onerror(err: any) {
			console.log(err);
		}
	});
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
				<!-- Creator Form-->
				<section aria-labelledby="new-link-tile">
					<div class="bg-primary text-primary-content card">
						<div class="text-center card-body items-center">
							<h2 class="text-2xl card-title">New Creator</h2>

							<div class="flex flex-col text-white p-2 justify-center items-center">
								<form use:form method="post">
									<input type="hidden" name="address" id="address" value={address} />
									<div class="max-w-xs w-full py-2 form-control">
										<!-- svelte-ignore a11y-label-has-associated-control -->
										<label class="label">
											<span class="label-text">Creator Name</span>
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

									<div class="py-4">
										<button class="btn btn-secondary" type="submit">Save Creator</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	</main>
</div>

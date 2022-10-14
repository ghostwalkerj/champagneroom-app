<script lang="ts">
	import type { LinkDocType } from '$lib/ORM/models/link';
	import { createForm } from 'svelte-forms-lib';
	import * as yup from 'yup';

	export let link: LinkDocType;

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const { form, errors, handleChange, handleSubmit, handleReset } = createForm({
		initialValues: { amount: '0' },
		validationSchema: yup.object({
			amount: yup
				.string()
				.matches(/^[1-9]\d{0,3}$/, 'Must be between $1 and $9999')
				.required()
		}),
		onSubmit: (values) => {
			if (talent) {
				// Must expire the current link, then create a new one.
				if (currentLink && linkService) {
					linkService.send({
						type: 'REQUEST CANCELLATION',
						cancel: {
							createdAt: new Date().getTime(),
							transactions: [],
							refundedAmount: 0, //TODO: This is only good before funding.
							canceledInState: linkService.getSnapshot().value.toString(),
							canceler: ActorType.TALENT
						}
					});
				}
				talent.createLink(Number.parseInt(values.amount));
				handleReset();
			}
		}
	});

	function claimLink() {
		dispatch('claimLink', {
			text: 'Pass to main component'
		});
	}
</script>

<!-- Link Form-->
<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">Create a New pCall Link</h2>
		<div class="flex flex-col text-white p-2 justify-center items-center">
			<form on:submit|preventDefault={handleSubmit}>
				<div class="max-w-xs w-full py-2 form-control ">
					<!-- svelte-ignore a11y-label-has-associated-control -->
					<label for="price" class="label">
						<span class="label-text">Requested Amount in USD</span></label
					>
					<div class="rounded-md shadow-sm mt-1 relative">
						<div class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none">
							<span class="text-gray-500 sm:text-sm"> $ </span>
						</div>
						<input
							type="text"
							name="amount"
							id="amount"
							class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
							placeholder="0.00"
							aria-describedby="price-currency"
							on:change={handleChange}
							bind:value={$form.amount}
						/>
						<div class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none">
							<span class="text-gray-500 sm:text-sm" id="price-currency"> USDC </span>
						</div>
					</div>
				</div>
				{#if $errors.amount}
					<div class="shadow-lg alert alert-error">{$errors.amount}</div>
				{/if}
				<div class="py-4">
					<button class="btn btn-secondary" type="submit" disabled={!canCreateLink}
						>Generate Link</button
					>
				</div>
			</form>
		</div>
	</div>
</div>
